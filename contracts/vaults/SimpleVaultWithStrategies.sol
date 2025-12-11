// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IStrategyAdapter.sol";

/**
 * @title SimpleVaultWithStrategies
 * @notice All-in-one vault with built-in strategy allocation
 * @dev Deposits are automatically split 70% Strategy A, 30% Strategy B
 */
contract SimpleVaultWithStrategies is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    IStrategyAdapter public strategyA; // 70% allocation - Lending
    IStrategyAdapter public strategyB; // 30% allocation - Beefy
    
    address public owner;
    
    // Allocation percentages (basis points)
    uint256 public constant STRATEGY_A_PERCENTAGE = 7000; // 70%
    uint256 public constant STRATEGY_B_PERCENTAGE = 3000; // 30%
    uint256 public constant BASIS_POINTS = 10000;
    
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 assets);
    event StrategiesUpdated(address strategyA, address strategyB);
    
    constructor(address _asset) ERC20("Base Jungle Vault", "BJV") {
        asset = IERC20(_asset);
        owner = msg.sender;
    }

    /**
     * @notice Set strategy addresses (only owner, only once or for updates)
     */
    function setStrategies(address _strategyA, address _strategyB) external {
        require(msg.sender == owner, "Only owner");
        strategyA = IStrategyAdapter(_strategyA);
        strategyB = IStrategyAdapter(_strategyB);
        emit StrategiesUpdated(_strategyA, _strategyB);
    }

    /**
     * @notice Deposit USDC and auto-allocate to strategies
     */
    function deposit(uint256 assets, address receiver) external nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");

        // Convert USDC (6 decimals) to shares (18 decimals)
        shares = assets * 1e12;

        // Transfer USDC from user
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Mint shares
        _mint(receiver, shares);

        // Allocate to strategies if set
        if (address(strategyA) != address(0) && address(strategyB) != address(0)) {
            _allocateToStrategies(assets);
        }

        emit Deposited(receiver, assets, shares);
        return shares;
    }

    /**
     * @notice Withdraw USDC (pulls from strategies if needed)
     */
    function withdraw(uint256 shares) external nonReentrant returns (uint256 assets) {
        require(shares > 0, "Zero shares");

        // Convert shares (18 decimals) back to USDC (6 decimals)
        assets = shares / 1e12;

        // Pull from strategies if vault doesn't have enough USDC
        uint256 vaultBalance = asset.balanceOf(address(this));
        if (vaultBalance < assets) {
            uint256 needed = assets - vaultBalance;
            _deallocateFromStrategies(needed);
        }

        // Burn shares
        _burn(msg.sender, shares);

        // Transfer USDC back
        asset.safeTransfer(msg.sender, assets);

        emit Withdrawn(msg.sender, shares, assets);
        return assets;
    }

    /**
     * @notice Internal: Allocate funds to strategies
     */
    function _allocateToStrategies(uint256 amount) internal {
        uint256 toStrategyA = (amount * STRATEGY_A_PERCENTAGE) / BASIS_POINTS; // 70%
        uint256 toStrategyB = (amount * STRATEGY_B_PERCENTAGE) / BASIS_POINTS; // 30%

        // Approve and deposit to Strategy A
        if (toStrategyA > 0) {
            asset.approve(address(strategyA), toStrategyA);
            strategyA.deposit(toStrategyA);
        }

        // Approve and deposit to Strategy B
        if (toStrategyB > 0) {
            asset.approve(address(strategyB), toStrategyB);
            strategyB.deposit(toStrategyB);
        }
    }

    /**
     * @notice Internal: Withdraw from strategies proportionally
     */
    function _deallocateFromStrategies(uint256 amount) internal {
        // Withdraw proportionally from both strategies
        uint256 fromStrategyA = (amount * STRATEGY_A_PERCENTAGE) / BASIS_POINTS;
        uint256 fromStrategyB = (amount * STRATEGY_B_PERCENTAGE) / BASIS_POINTS;

        if (fromStrategyA > 0) {
            strategyA.withdraw(fromStrategyA);
        }

        if (fromStrategyB > 0) {
            strategyB.withdraw(fromStrategyB);
        }
    }

    /**
     * @notice Get total USDC (vault + strategies)
     */
    function totalAssets() public view returns (uint256) {
        uint256 vaultBalance = asset.balanceOf(address(this));
        uint256 strategyABalance = address(strategyA) != address(0) ? strategyA.balanceOf() : 0;
        uint256 strategyBBalance = address(strategyB) != address(0) ? strategyB.balanceOf() : 0;
        
        return vaultBalance + strategyABalance + strategyBBalance;
    }

    /**
     * @notice Get yield earned (total assets - total shares in USDC)
     */
    function totalYield() public view returns (uint256) {
        uint256 totalShares = totalSupply();
        uint256 sharesInUSDC = totalShares / 1e12; // Convert to USDC units
        uint256 currentAssets = totalAssets();
        
        return currentAssets > sharesInUSDC ? currentAssets - sharesInUSDC : 0;
    }

    // ERC4626 compatibility functions
    function convertToAssets(uint256 shares) public view returns (uint256) {
        // Account for yield: assets might be more than shares
        uint256 totalShares = totalSupply();
        if (totalShares == 0) return shares / 1e12;
        
        return (shares * totalAssets()) / totalShares;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 totalShares = totalSupply();
        if (totalShares == 0) return assets * 1e12;
        
        return (assets * totalShares) / totalAssets();
    }

    function previewDeposit(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }

    function previewWithdraw(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }
}

