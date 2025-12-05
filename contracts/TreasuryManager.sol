// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TreasuryManager
 * @notice Manages funds received from position purchases with multi-sig and timelock.
 */
contract TreasuryManager is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant WITHDRAWAL_APPROVER_ROLE = keccak256("WITHDRAWAL_APPROVER_ROLE");

    // Allocation percentages (basis points, 10000 = 100%)
    uint256 public constant LIQUIDITY_ALLOCATION = 4000; // 40%
    uint256 public constant DEV_ALLOCATION = 3000; // 30%
    uint256 public constant MARKETING_ALLOCATION = 2000; // 20%
    uint256 public constant TEAM_ALLOCATION = 1000; // 10%

    uint256 public constant MIN_APPROVALS = 3; // 3 of 5 multisig
    uint256 public constant TIMELOCK_PERIOD = 2 days;

    struct Fund {
        uint256 liquidityReserve;
        uint256 developmentFund;
        uint256 marketingFund;
        uint256 teamFund;
        uint256 totalReceived;
    }

    struct WithdrawalRequest {
        uint256 id;
        address token;
        address recipient;
        uint256 amount;
        string fundType; // "liquidity", "dev", "marketing", "team"
        string purpose;
        uint256 requestTime;
        uint256 approvals;
        bool executed;
    }

    mapping(address => Fund) public funds; // per stablecoin
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    mapping(uint256 => bool) public cancelledRequests; // M-5 FIX: Track cancelled requests
    uint256 public nextRequestId;

    event FundsReceived(
        address indexed token,
        uint256 amount,
        address indexed from,
        string source
    );

    event WithdrawalRequested(
        uint256 indexed requestId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        string fundType,
        string purpose
    );

    event WithdrawalApproved(
        uint256 indexed requestId,
        address indexed approver
    );

    event WithdrawalExecuted(
        uint256 indexed requestId,
        address indexed recipient,
        uint256 amount
    );
    
    event WithdrawalCancelled(
        uint256 indexed requestId,
        address indexed canceller
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
        _grantRole(WITHDRAWAL_APPROVER_ROLE, msg.sender);
    }

    /**
     * @notice Receive funds from position purchases and allocate to buckets.
     */
    function receiveFunds(
        address token,
        uint256 amount,
        string calldata source
    ) external onlyRole(TREASURER_ROLE) nonReentrant {
        require(amount > 0, "Zero amount");

        // Transfer from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Allocate to different funds
        uint256 toLiquidity = (amount * LIQUIDITY_ALLOCATION) / 10000;
        uint256 toDev = (amount * DEV_ALLOCATION) / 10000;
        uint256 toMarketing = (amount * MARKETING_ALLOCATION) / 10000;
        uint256 toTeam = (amount * TEAM_ALLOCATION) / 10000;

        Fund storage fund = funds[token];
        fund.liquidityReserve += toLiquidity;
        fund.developmentFund += toDev;
        fund.marketingFund += toMarketing;
        fund.teamFund += toTeam;
        fund.totalReceived += amount;

        emit FundsReceived(token, amount, msg.sender, source);
    }

    /**
     * @notice Request withdrawal (requires multi-sig approval).
     */
    function requestWithdrawal(
        address token,
        address recipient,
        uint256 amount,
        string calldata fundType,
        string calldata purpose
    ) external onlyRole(TREASURER_ROLE) returns (uint256) {
        require(amount > 0, "Zero amount");
        require(recipient != address(0), "Zero address");

        // Verify fund has sufficient balance
        Fund storage fund = funds[token];
        bytes32 fundTypeHash = keccak256(bytes(fundType));
        
        if (fundTypeHash == keccak256(bytes("liquidity"))) {
            require(fund.liquidityReserve >= amount, "Insufficient liquidity funds");
        } else if (fundTypeHash == keccak256(bytes("dev"))) {
            require(fund.developmentFund >= amount, "Insufficient dev funds");
        } else if (fundTypeHash == keccak256(bytes("marketing"))) {
            require(fund.marketingFund >= amount, "Insufficient marketing funds");
        } else if (fundTypeHash == keccak256(bytes("team"))) {
            require(fund.teamFund >= amount, "Insufficient team funds");
        } else {
            revert("Invalid fund type");
        }

        // Create withdrawal request
        uint256 requestId = nextRequestId++;
        withdrawalRequests[requestId] = WithdrawalRequest({
            id: requestId,
            token: token,
            recipient: recipient,
            amount: amount,
            fundType: fundType,
            purpose: purpose,
            requestTime: block.timestamp,
            approvals: 0,
            executed: false
        });

        emit WithdrawalRequested(requestId, token, recipient, amount, fundType, purpose);

        return requestId;
    }

    /**
     * @notice Approve withdrawal (multi-sig).
     */
    function approveWithdrawal(uint256 requestId)
        external
        onlyRole(WITHDRAWAL_APPROVER_ROLE)
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(!request.executed, "Already executed");
        require(!cancelledRequests[requestId], "Request cancelled");
        require(!hasApproved[requestId][msg.sender], "Already approved");

        hasApproved[requestId][msg.sender] = true;
        request.approvals++;

        emit WithdrawalApproved(requestId, msg.sender);
    }
    
    /**
     * @notice Cancel a withdrawal request before execution.
     * @dev M-5 FIX: Allows multi-sig to cancel suspicious requests
     */
    function cancelWithdrawal(uint256 requestId)
        external
        onlyRole(WITHDRAWAL_APPROVER_ROLE)
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(!request.executed, "Already executed");
        require(!cancelledRequests[requestId], "Already cancelled");
        
        cancelledRequests[requestId] = true;
        
        emit WithdrawalCancelled(requestId, msg.sender);
    }

    /**
     * @notice Execute withdrawal (after timelock + approvals).
     */
    function executeWithdrawal(uint256 requestId) external nonReentrant {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(!request.executed, "Already executed");
        require(!cancelledRequests[requestId], "Request cancelled");
        require(request.approvals >= MIN_APPROVALS, "Insufficient approvals");
        require(
            block.timestamp >= request.requestTime + TIMELOCK_PERIOD,
            "Timelock not expired"
        );

        // Deduct from appropriate fund
        Fund storage fund = funds[request.token];
        bytes32 fundTypeHash = keccak256(bytes(request.fundType));
        
        if (fundTypeHash == keccak256(bytes("liquidity"))) {
            fund.liquidityReserve -= request.amount;
        } else if (fundTypeHash == keccak256(bytes("dev"))) {
            fund.developmentFund -= request.amount;
        } else if (fundTypeHash == keccak256(bytes("marketing"))) {
            fund.marketingFund -= request.amount;
        } else if (fundTypeHash == keccak256(bytes("team"))) {
            fund.teamFund -= request.amount;
        }

        // Mark as executed
        request.executed = true;

        // Transfer funds
        IERC20(request.token).safeTransfer(request.recipient, request.amount);

        emit WithdrawalExecuted(requestId, request.recipient, request.amount);
    }

    /**
     * @notice View functions for transparency.
     */
    function getFundBreakdown(address token)
        external
        view
        returns (
            uint256 liquidity,
            uint256 dev,
            uint256 marketing,
            uint256 team,
            uint256 total
        )
    {
        Fund storage fund = funds[token];
        return (
            fund.liquidityReserve,
            fund.developmentFund,
            fund.marketingFund,
            fund.teamFund,
            fund.totalReceived
        );
    }

    function getWithdrawalRequest(uint256 requestId)
        external
        view
        returns (
            address token,
            address recipient,
            uint256 amount,
            string memory fundType,
            string memory purpose,
            uint256 requestTime,
            uint256 approvals,
            bool executed
        )
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        return (
            request.token,
            request.recipient,
            request.amount,
            request.fundType,
            request.purpose,
            request.requestTime,
            request.approvals,
            request.executed
        );
    }

    /**
     * @notice Emergency pause.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
