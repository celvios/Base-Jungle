const { ethers } = require("hardhat");
const ADDRESSES = require("./addresses");

/**
 * Impersonate an account and fund it with ETH
 */
async function impersonateAccount(address) {
    await ethers.provider.send("hardhat_impersonateAccount", [address]);
    const signer = await ethers.getSigner(address);

    // Fund with ETH for gas
    await ethers.provider.send("hardhat_setBalance", [
        address,
        "0x" + (10n ** 20n).toString(16), // 100 ETH
    ]);

    return signer;
}

/**
 * Stop impersonating an account
 */
async function stopImpersonating(address) {
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [address]);
}

/**
 * Get USDC tokens by impersonating a whale
 */
async function getUSDC(recipientAddress, amount) {
    const usdc = await ethers.getContractAt(
        "IERC20",
        ADDRESSES.USDC
    );

    // Impersonate USDC whale
    const whale = await impersonateAccount(ADDRESSES.USDC_WHALE);

    // Transfer USDC to recipient
    await usdc.connect(whale).transfer(recipientAddress, amount);

    await stopImpersonating(ADDRESSES.USDC_WHALE);

    return usdc;
}

/**
 * Get WETH tokens by depositing ETH
 */
async function getWETH(signer, amount) {
    const weth = await ethers.getContractAt(
        ["function deposit() payable", "function balanceOf(address) view returns (uint256)"],
        ADDRESSES.WETH
    );

    // Deposit ETH to get WETH
    await weth.connect(signer).deposit({ value: amount });

    return weth;
}

/**
 * Fund a test account with both USDC and WETH
 */
async function fundTestAccount(signer, usdcAmount, wethAmount) {
    const usdc = await getUSDC(signer.address, usdcAmount);
    const weth = await getWETH(signer, wethAmount);

    return { usdc, weth };
}

module.exports = {
    impersonateAccount,
    stopImpersonating,
    getUSDC,
    getWETH,
    fundTestAccount
};
