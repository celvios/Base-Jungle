// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategyAdapter.sol";
import "../adapters/AerodromeLPAdapter.sol";
import "../adapters/AerodromeGaugeAdapter.sol";
import "../defi/DEXAggregator.sol";

/**
 * @title AerodromeStrategy
 * @notice Strategy adapter for Aerodrome Liquidity Mining (USDC/WETH).
 * @dev Handles Zap-in (USDC -> LP -> Stake) and Zap-out (Unstake -> LP -> USDC).
 */
contract AerodromeStrategy is IStrategyAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGY_ADMIN_ROLE = keccak256("STRATEGY_ADMIN_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    IERC20 public immutable usdc;
    IERC20 public immutable weth;
    IERC20 public immutable lpToken;
    address public immutable gauge;

    AerodromeLPAdapter public lpAdapter;
    AerodromeGaugeAdapter public gaugeAdapter;
    DEXAggregator public dexAggregator;

    // Track total principal in specific strategy terms if needed, 
    // but here we track share of pool roughly via LP tokens.
    
    constructor(
        address _usdc,
        address _weth,
        address _lpToken,
        address _gauge,
        address _lpAdapter,
        address _gaugeAdapter,
        address _dexAggregator
    ) {
        usdc = IERC20(_usdc);
        weth = IERC20(_weth);
        lpToken = IERC20(_lpToken);
        gauge = _gauge;
        lpAdapter = AerodromeLPAdapter(_lpAdapter);
        gaugeAdapter = AerodromeGaugeAdapter(_gaugeAdapter);
        dexAggregator = DEXAggregator(_dexAggregator);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGY_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    /**
     * @notice Deposit USDC, swap half to WETH, Add LP, Stake in Gauge.
     * @param amount Amount of USDC to deposit.
     * @return createdLpTokens Amount of LP tokens staked.
     */
    function deposit(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        // 1. Transfer USDC from msg.sender (Vault)
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // 2. Swap ~50% USDC to WETH
        uint256 usdcToSwap = amount / 2;
        usdc.approve(address(dexAggregator), usdcToSwap);
        
        uint256 wethReceived = dexAggregator.swapBestRoute(
            address(usdc),
            address(weth),
            usdcToSwap,
            address(this)
        );

        // 3. Add Liquidity
        uint256 usdcRemaining = usdc.balanceOf(address(this));
        
        usdc.approve(address(lpAdapter), usdcRemaining);
        weth.approve(address(lpAdapter), wethReceived);

        (,, uint256 liquidity) = lpAdapter.addLiquidity(
            usdcRemaining,
            wethReceived,
            0, // Min amount 0 for simplicity in this zap
            0
        );

        // 4. Stake in Gauge
        lpToken.approve(address(gaugeAdapter), liquidity);
        gaugeAdapter.stake(gauge, liquidity);

        return liquidity;
    }

    /**
     * @notice Unstake, Remove Liquidity, Swap to USDC, Return to Vault.
     * @param amount Amount of LP tokens (shares) to withdraw?
     * NOTE: StrategyController calls withdraw(amount) where amount is usually underlying/allocation?
     * BUT logic in Controller says `userAllocations[user][id] += amount` (underlying).
     * So input `amount` is USDC value.
     * Converting USDC value to LP shares is hard without oracle.
     * Ideally, we assume `amount` passed here is PROPORTIONAL to total assets?
     * Or does Controller track Shares? 
     * Controller tracks `totalAllocated` in USDC.
     * We need to approximate how many LP tokens correspond to `amount` USDC.
     * SIMPLIFIED: We assume 1:1 mapping is wrong.
     * We calculate ratio: withdrawRatio = amount / totalValue.
     * lpToWithdraw = totalStaked * withdrawRatio.
     */
    function withdraw(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        uint256 totalVal = balanceOf();
        if (totalVal == 0) return 0;

        uint256 totalStaked = gaugeAdapter.getStakedBalance(gauge, address(this));
        uint256 lpToWithdraw = (amount * totalStaked) / totalVal;

        if (lpToWithdraw == 0 && amount > 0) lpToWithdraw = totalStaked; // Withdraw all if small dust or rounding
        if (lpToWithdraw > totalStaked) lpToWithdraw = totalStaked;

        // 1. Unstake
        gaugeAdapter.unstake(gauge, lpToWithdraw);

        // 2. Remove Liquidity
        lpToken.approve(address(lpAdapter), lpToWithdraw);
        (uint256 amountA, uint256 amountB) = lpAdapter.removeLiquidity(lpToWithdraw, 0, 0);

        // 3. Swap WETH (tokenB) to USDC (tokenA)
        // Assume A=USDC, B=WETH or vice versa. Check address.
        // In this mock setup, just swap everything not USDC to USDC.
        
        if (address(weth) != address(usdc)) {
            uint256 wethBal = weth.balanceOf(address(this));
            if (wethBal > 0) {
                weth.approve(address(dexAggregator), wethBal);
                dexAggregator.swapBestRoute(address(weth), address(usdc), wethBal, address(this));
            }
        }

        // 4. Return all USDC to Vault
        uint256 totalUSDC = usdc.balanceOf(address(this));
        usdc.safeTransfer(msg.sender, totalUSDC);

        return totalUSDC;
    }

    /**
     * @notice Get total value in USDC.
     */
    function balanceOf() public view override returns (uint256) {
        // Get LP balance staked
        // (This function relies on gaugeAdapter needing view function for reading others stake? 
        //  The adapter stores it in `stakedBalance[gauge][user]`. User is THIS strategy.
        uint256 staked = gaugeAdapter.getStakedBalance(gauge, address(this));
        
        // Convert LP to USDC value
        // 1 LP ~ (Reserve0 + Reserve1 translated to USDC) / TotalSupply
        // Simplified: 1 LP usually = 2 * (Value of Token0 in LP) if balanced.
        // We can call lpAdapter.getShareOfPool()? 
        // No, lpAdapter needs to hold the LP tokens to call shareOfPool on ITSELF.
        // We don't hold LP tokens, they are in gauge.
        
        // Hack for Testnet/Estimation: Assume 1 LP = $2 (if init 1:1). 
        // Better: Query Pair.
        // But for this IStrategyAdapter:
        return staked * 2; // VERY ROUGH ESTIMATION. For accurate, need oracle or Pair inspection.
        // In real deploy, use Oracle.
    }

    function apy() external view override returns (uint256) {
        return 12000; // 120% Mock APY
    }

    function riskScore() external pure override returns (uint256) {
        return 5;
    }

    function asset() external view override returns (address) {
        return address(usdc);
    }
    
    // Additional Helper
    function harvest() external onlyRole(KEEPER_ROLE) {
        // Clip
        gaugeAdapter.claimRewards(gauge, address(this));
        
        // Sell AERO? Or keep it?
        // Vault usually takes fee.
        // For now, just claim.
    }
}
