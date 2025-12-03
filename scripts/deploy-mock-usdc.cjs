const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying MockERC20 USDC for testing...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy MockERC20
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC");

    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();

    console.log("✅ MockERC20 USDC deployed to:", usdcAddress);
    console.log("\n📝 Update your .env files with:");
    console.log(`USDC_ADDRESS=${usdcAddress}`);
    console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);

    console.log("\n🎉 You can now mint unlimited USDC using the mint(address, uint256) function!");
    console.log("The deployer already has 1,000,000 USDC from the constructor.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
