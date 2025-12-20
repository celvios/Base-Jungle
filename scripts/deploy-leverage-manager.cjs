const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying LeverageManager to Base Sepolia...");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    // Contract addresses on Base Sepolia
    const REFERRAL_MANAGER_ADDRESS = process.env.REFERRAL_MANAGER_ADDRESS || "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
    const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC

    console.log("Using ReferralManager:", REFERRAL_MANAGER_ADDRESS);
    console.log("Using USDC:", USDC_ADDRESS);

    // Deploy LeverageManager
    const LeverageManager = await ethers.getContractFactory("contracts/LeverageManager.sol:LeverageManager");
    const leverageManager = await LeverageManager.deploy(
        REFERRAL_MANAGER_ADDRESS,
        USDC_ADDRESS
    );

    await leverageManager.waitForDeployment();
    const address = await leverageManager.getAddress();

    console.log("✅ LeverageManager deployed to:", address);

    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    console.log("LeverageManager:", address);
    console.log("Network: Base Sepolia Testnet");
    
    console.log("\n🔧 Add to your .env:");
    console.log("LEVERAGE_MANAGER_ADDRESS=" + address);

    console.log("\n🎯 Tier Leverage Limits:");
    console.log("Novice: 1.0x (no leverage)");
    console.log("Scout: 2.0x");
    console.log("Captain: 3.0x");
    console.log("Whale: 5.0x");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });