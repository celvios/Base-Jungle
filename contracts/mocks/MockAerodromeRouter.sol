// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAerodromeRouter
 * @notice Mock implementation of Aerodrome Router for testing
 */
contract MockAerodromeRouter {
    struct Route {
        address from;
        address to;
        bool stable;
    }

    mapping(bytes32 => uint256) public quotes;

    function setQuote(address from, address to, bool stable, uint256 amountOut) external {
        bytes32 key = keccak256(abi.encodePacked(from, to, stable));
        quotes[key] = amountOut;
    }

    function getAmountsOut(uint256 amountIn, Route[] memory routes)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](routes.length + 1);
        amounts[0] = amountIn;
        
        for (uint256 i = 0; i < routes.length; i++) {
            bytes32 key = keccak256(abi.encodePacked(routes[i].from, routes[i].to, routes[i].stable));
            amounts[i + 1] = quotes[key];
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "Expired");
        
        amounts = new uint256[](routes.length + 1);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < routes.length; i++) {
            IERC20(routes[i].from).transferFrom(msg.sender, address(this), amountIn);
            
            bytes32 key = keccak256(abi.encodePacked(routes[i].from, routes[i].to, routes[i].stable));
            uint256 amountOut = quotes[key];
            require(amountOut >= amountOutMin, "Insufficient output");
            
            amounts[i + 1] = amountOut;
            IERC20(routes[i].to).transfer(to, amountOut);
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        require(block.timestamp <= deadline, "Expired");
        
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);
        
        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = (amountA + amountB) / 2; // Simplified
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(block.timestamp <= deadline, "Expired");
        
        amountA = liquidity / 2;
        amountB = liquidity / 2;
        
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);
    }
}
