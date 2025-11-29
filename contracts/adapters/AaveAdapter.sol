// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (DataTypes.ReserveData memory);
}

library DataTypes {
    struct ReserveData {
        //stores the reserve configuration
        ReserveConfigurationMap configuration;
        //the liquidity index. Expressed in ray
        uint128 liquidityIndex;
        //the current supply rate. Expressed in ray
        uint128 currentLiquidityRate;
        //the variable borrow index. Expressed in ray
        uint128 variableBorrowIndex;
        //the current variable borrow rate. Expressed in ray
        uint128 currentVariableBorrowRate;
        //the current stable borrow rate. Expressed in ray
        uint128 currentStableBorrowRate;
        //timestamp of last update
        uint40 lastUpdateTimestamp;
        //the id of the reserve. PPV3
        uint16 id;
        //aToken address
        address aTokenAddress;
        //stableDebtToken address
        address stableDebtTokenAddress;
        //variableDebtToken address
        address variableDebtTokenAddress;
        //address of the interest rate strategy
        address interestRateStrategyAddress;
        //the current treasury balance, scaled
        uint128 accruedToTreasury;
        //the outstanding unbacked aTokens minted through the bridge
        uint128 unbacked;
        //the outstanding isolation mode debt
        uint128 isolationModeTotalDebt;
    }

    struct ReserveConfigurationMap {
        //bit 0-15: LTV
        //bit 16-31: Liq. threshold
        //bit 32-47: Liq. bonus
        //bit 48-55: Decimals
        //bit 56: Reserve is active
        //bit 57: Reserve is frozen
        //bit 58: Borrowing is enabled
        //bit 59: Stable borrowing is enabled
        //bit 60: Asset is paused
        //bit 61: Borrowing in isolation mode is enabled
        //bit 62: Siloed borrowing enabled
        //bit 63: Flashloaning enabled
        //bit 64-79: Reserve factor
        uint256 data;
    }
}

contract AaveAdapter is IStrategyAdapter, AccessControl {
    
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    IPool public immutable aavePool;
    address public immutable asset;
    IERC20 public aToken;
    
    constructor(address _aavePool, address _asset) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        aavePool = IPool(_aavePool);
        asset = _asset;
        
        // Get aToken address (in real deployment this works, for tests we might need to set it or mock pool)
        try aavePool.getReserveData(_asset) returns (DataTypes.ReserveData memory reserve) {
            aToken = IERC20(reserve.aTokenAddress);
        } catch {
            // Fallback for deployment if pool not ready or mocking
        }
    }
    
    function setAToken(address _aToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aToken = IERC20(_aToken);
    }

    function deposit(uint256 amount) 
        external 
        onlyRole(VAULT_ROLE) 
        returns (uint256) 
    {
        IERC20(asset).approve(address(aavePool), amount);
        aavePool.supply(asset, amount, address(this), 0);
        return amount;
    }
    
    function withdraw(uint256 amount) 
        external 
        onlyRole(VAULT_ROLE) 
        returns (uint256) 
    {
        uint256 withdrawn = aavePool.withdraw(
            asset,
            amount,
            msg.sender
        );
        return withdrawn;
    }
    
    function balanceOf() external view returns (uint256) {
        if (address(aToken) == address(0)) return 0;
        return aToken.balanceOf(address(this));
    }
    
    function apy() external view returns (uint256) {
        try aavePool.getReserveData(address(asset)) returns (DataTypes.ReserveData memory reserve) {
            return reserve.currentLiquidityRate / 1e25; // Convert to %
        } catch {
            return 0;
        }
    }
    
    function riskScore() external pure returns (uint256) {
        return 15; // 0.15 = 15% (Aave is low risk)
    }
}
