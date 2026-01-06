const { ethers } = require("hardhat");

async function main() {
    const walletAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(walletAddress);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Check USDC balance
    const usdc = new ethers.Contract(
        USDC_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
    );
    
    const usdcBalance = await usdc.balanceOf(walletAddress);
    console.log(`💵 USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
}

main().catch(console.error);