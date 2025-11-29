// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IBeefyVault
 * @notice Interface for Beefy Finance auto-compounding vaults.
 */
interface IBeefyVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 shares) external;
    function withdrawAll() external;
    
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    
    function getPricePerFullShare() external view returns (uint256);
    function want() external view returns (address);
}
