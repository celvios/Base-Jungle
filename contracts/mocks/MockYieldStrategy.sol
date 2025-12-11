// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockYieldStrategy
 * @notice Mock strategy that simulates yield accumulation for testing.
 * @dev Yield accrues based on APY and time elapsed.
 */
contract MockYieldStrategy is IStrategyAdapter, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable strategyAsset;
    address public override asset;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public apyBasisPoints;     // APY in basis points (500 = 5%)
    uint256 public riskScoreBps;       // Risk in basis points
    
    uint256 public totalDeposited;     // Total principal deposited
    uint256 public lastYieldTime;      // Last time yield was calculated
    uint256 public accumulatedYield;   // Yield accumulated since last harvest
    
    // Tracking per user for accurate withdrawals
    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userYield;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield);
    event YieldAccrued(uint256 amount, uint256 timestamp);
    event YieldHarvested(uint256 amount);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);

    constructor(
        address _asset,
        uint256 _apyBasisPoints,
        uint256 _riskScore
    ) Ownable(msg.sender) {
        require(_asset != address(0), "Invalid asset");
        
        strategyAsset = IERC20(_asset);
        asset = _asset;
        apyBasisPoints = _apyBasisPoints;
        riskScoreBps = _riskScore;
        lastYieldTime = block.timestamp;
    }

    /**
     * @notice Deposit assets into the strategy.
     */
    function deposit(uint256 amount) external override returns (uint256) {
        require(amount > 0, "Amount zero");
        
        // Accrue yield before deposit
        _accrueYield();
        
        // Transfer from caller
        strategyAsset.safeTransferFrom(msg.sender, address(this), amount);
        
        totalDeposited += amount;
        userDeposits[msg.sender] += amount;
        
        emit Deposited(msg.sender, amount);
        return amount;
    }

    /**
     * @notice Withdraw assets from the strategy.
     */
    function withdraw(uint256 amount) external override returns (uint256) {
        require(amount > 0, "Amount zero");
        
        // Accrue yield before withdrawal
        _accrueYield();
        
        // Calculate user's share of yield
        uint256 userPrincipal = userDeposits[msg.sender];
        require(userPrincipal >= amount, "Insufficient balance");
        
        uint256 userYieldShare = 0;
        if (totalDeposited > 0 && accumulatedYield > 0) {
            userYieldShare = (accumulatedYield * userPrincipal) / totalDeposited;
        }
        
        // Update state
        totalDeposited -= amount;
        userDeposits[msg.sender] -= amount;
        
        // Transfer principal + proportional yield
        uint256 totalToSend = amount + userYieldShare;
        
        // Make sure we have enough (in real scenarios, yield comes from external source)
        uint256 balance = strategyAsset.balanceOf(address(this));
        if (totalToSend > balance) {
            totalToSend = balance;
        }
        
        if (userYieldShare > 0 && userYieldShare <= accumulatedYield) {
            accumulatedYield -= userYieldShare;
        }
        
        strategyAsset.safeTransfer(msg.sender, totalToSend);
        
        emit Withdrawn(msg.sender, amount, userYieldShare);
        return totalToSend;
    }

    /**
     * @notice Get total balance including accumulated yield.
     */
    function balanceOf() external view override returns (uint256) {
        return totalDeposited + _pendingYield() + accumulatedYield;
    }

    /**
     * @notice Get current APY in basis points.
     */
    function apy() external view override returns (uint256) {
        return apyBasisPoints;
    }

    /**
     * @notice Get risk score.
     */
    function riskScore() external view override returns (uint256) {
        return riskScoreBps;
    }

    /**
     * @notice Calculate pending yield since last accrual.
     */
    function _pendingYield() internal view returns (uint256) {
        if (totalDeposited == 0 || lastYieldTime == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastYieldTime;
        uint256 secondsPerYear = 365 days;
        
        // yield = principal * APY * timeElapsed / secondsPerYear
        uint256 yield = (totalDeposited * apyBasisPoints * timeElapsed) / (BASIS_POINTS * secondsPerYear);
        
        return yield;
    }

    /**
     * @notice Accrue yield to accumulated balance.
     */
    function _accrueYield() internal {
        uint256 pending = _pendingYield();
        if (pending > 0) {
            accumulatedYield += pending;
            emit YieldAccrued(pending, block.timestamp);
        }
        lastYieldTime = block.timestamp;
    }

    /**
     * @notice Get pending yield (view function).
     */
    function getPendingYield() external view returns (uint256) {
        return _pendingYield() + accumulatedYield;
    }

    /**
     * @notice Admin: Add yield manually (simulates external yield source).
     */
    function addYield(uint256 amount) external onlyOwner {
        strategyAsset.safeTransferFrom(msg.sender, address(this), amount);
        accumulatedYield += amount;
        emit YieldAccrued(amount, block.timestamp);
    }

    /**
     * @notice Admin: Update APY.
     */
    function setAPY(uint256 newAPY) external onlyOwner {
        _accrueYield(); // Accrue with old APY first
        uint256 oldAPY = apyBasisPoints;
        apyBasisPoints = newAPY;
        emit APYUpdated(oldAPY, newAPY);
    }

    /**
     * @notice Harvest accumulated yield (returns to caller).
     */
    function harvest() external returns (uint256) {
        _accrueYield();
        
        uint256 toHarvest = accumulatedYield;
        require(toHarvest > 0, "Nothing to harvest");
        
        uint256 balance = strategyAsset.balanceOf(address(this));
        if (toHarvest > balance - totalDeposited) {
            toHarvest = balance > totalDeposited ? balance - totalDeposited : 0;
        }
        
        accumulatedYield = 0;
        
        if (toHarvest > 0) {
            strategyAsset.safeTransfer(msg.sender, toHarvest);
        }
        
        emit YieldHarvested(toHarvest);
        return toHarvest;
    }
}

