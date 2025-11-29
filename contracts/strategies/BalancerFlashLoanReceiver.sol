// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Balancer V2 Interfaces
interface IVault {
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}

interface IFlashLoanRecipient {
    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external;
}

/**
 * @title BalancerFlashLoanReceiver
 * @notice Receives flash loans from Balancer V2 Vault
 * @dev Balancer charges 0% flash loan fees, making it perfect for arbitrage
 */
contract BalancerFlashLoanReceiver is IFlashLoanRecipient, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");

    IVault public immutable balancerVault;
    address public arbitrageStrategy;

    event FlashLoanExecuted(
        address[] tokens,
        uint256[] amounts,
        uint256 profit
    );

    event ArbitrageStrategyUpdated(address newStrategy);

    constructor(address _balancerVault) {
        require(_balancerVault != address(0), "Invalid vault");
        
        balancerVault = IVault(_balancerVault);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGY_ROLE, msg.sender);
    }

    /**
     * @notice Request flash loan from Balancer
     * @param tokens Array of token addresses to borrow
     * @param amounts Array of amounts to borrow
     * @param userData Arbitrary data to pass to receiveFlashLoan
     */
    function requestFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external onlyRole(STRATEGY_ROLE) nonReentrant {
        require(tokens.length == amounts.length, "Length mismatch");
        require(tokens.length > 0, "Empty arrays");

        balancerVault.flashLoan(
            address(this),
            tokens,
            amounts,
            userData
        );
    }

    /**
     * @notice Callback function called by Balancer Vault
     * @dev This is where arbitrage logic executes
     * @param tokens Tokens received in flash loan
     * @param amounts Amounts received
     * @param feeAmounts Fees to pay (always 0 for Balancer!)
     * @param userData Encoded arbitrage parameters
     */
    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override nonReentrant {
        require(msg.sender == address(balancerVault), "Caller must be vault");

        // Decode arbitrage parameters
        (
            address[] memory swapPath,
            address[] memory dexAddresses,
            uint256 minProfit
        ) = abi.decode(userData, (address[], address[], uint256));

        // Execute arbitrage swaps
        uint256 finalAmount = _executeArbitrageRoute(
            address(tokens[0]),
            amounts[0],
            swapPath,
            dexAddresses
        );

        // Calculate profit (Balancer fee is 0!)
        uint256 totalRepayment = amounts[0] + feeAmounts[0];
        require(finalAmount >= totalRepayment + minProfit, "Insufficient profit");

        uint256 profit = finalAmount - totalRepayment;

        // Transfer funds back to Balancer Vault
        tokens[0].safeTransfer(address(balancerVault), totalRepayment);

        // Transfer profit to strategy
        if (profit > 0 && arbitrageStrategy != address(0)) {
            tokens[0].safeTransfer(arbitrageStrategy, profit);
        }

        emit FlashLoanExecuted(
            _toAddressArray(tokens),
            amounts,
            profit
        );
    }

    /**
     * @notice Execute arbitrage swap route across multiple DEXs
     * @param startToken Token to start with (flash loaned token)
     * @param startAmount Amount to start with
     * @param path Swap path (token addresses)
     * @param dexes DEX addresses for each swap
     * @return finalAmount Final amount received
     */
    function _executeArbitrageRoute(
        address startToken,
        uint256 startAmount,
        address[] memory path,
        address[] memory dexes
    ) internal returns (uint256 finalAmount) {
        require(path.length >= 2, "Path too short");
        require(dexes.length == path.length - 1, "Invalid dex count");

        uint256 currentAmount = startAmount;
        address currentToken = startToken;

        for (uint256 i = 0; i < dexes.length; i++) {
            address nextToken = path[i + 1];
            
            // Approve DEX to spend current token
            IERC20(currentToken).approve(dexes[i], currentAmount);

            // Execute swap on DEX
            currentAmount = _executeSwap(
                dexes[i],
                currentToken,
                nextToken,
                currentAmount
            );

            currentToken = nextToken;
        }

        // Ensure we end with the same token we started with
        require(currentToken == startToken, "Invalid route");

        return currentAmount;
    }

    /**
     * @notice Execute single swap on a DEX
     * @dev This is a simplified version - real implementation would integrate with DEXAggregator
     * @param dex DEX address
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Output amount received
     */
    function _executeSwap(
        address dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256 amountOut) {
        // Placeholder - actual implementation would call DEXAggregator
        // This allows the contract to compile
        return amountIn;
    }

    /**
     * @notice Convert IERC20 array to address array
     */
    function _toAddressArray(IERC20[] memory tokens) internal pure returns (address[] memory) {
        address[] memory addresses = new address[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            addresses[i] = address(tokens[i]);
        }
        return addresses;
    }

    /**
     * @notice Set arbitrage strategy address
     * @param _strategy New strategy address
     */
    function setArbitrageStrategy(address _strategy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_strategy != address(0), "Invalid strategy");
        arbitrageStrategy = _strategy;
        emit ArbitrageStrategyUpdated(_strategy);
    }

    /**
     * @notice Emergency withdraw stuck tokens
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Get available flash loan amount for a token
     * @dev Queries Balancer vault's available liquidity
     */
    function getAvailableFlashLoan(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(balancerVault));
    }
}
