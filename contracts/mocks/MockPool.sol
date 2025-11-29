// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockPool {
    IERC20 public asset;
    IERC20 public aToken;

    constructor(address _asset, address _aToken) {
        asset = IERC20(_asset);
        aToken = IERC20(_aToken);
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        // Transfer asset from caller (adapter) to pool
        asset.transferFrom(msg.sender, address(this), amount);
        // Mint aToken to the adapter (simplified 1:1 ratio)
        // In a real pool, this would be minted by the aToken contract.
        // For this mock, we just transfer from pool reserves if we have, or we could make aToken mintable.
        // Let's assume aToken is a MockERC20 and we can mint directly.
        // Actually, we don't have mint function exposed here for aToken.
        // The test pre-mints aTokens to the adapter to simulate receipt.
        // So this function just needs to accept the asset.
        // We don't need to do anything with aToken here since the test handles it manually.
    }

    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        // Transfer asset from pool to requester
        asset.transfer(to, amount);
        return amount;
    }

    struct ReserveData {
        uint256 configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }

    function getReserveData(address) external view returns (ReserveData memory) {
        return ReserveData({
            configuration: 0,
            liquidityIndex: 0,
            currentLiquidityRate: 5 * 1e25, // 5%
            variableBorrowIndex: 0,
            currentVariableBorrowRate: 0,
            currentStableBorrowRate: 0,
            lastUpdateTimestamp: 0,
            id: 0,
            aTokenAddress: address(aToken),
            stableDebtTokenAddress: address(0),
            variableDebtTokenAddress: address(0),
            interestRateStrategyAddress: address(0),
            accruedToTreasury: 0,
            unbacked: 0,
            isolationModeTotalDebt: 0
        });
    }
}
