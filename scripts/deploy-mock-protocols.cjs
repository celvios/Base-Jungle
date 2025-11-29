const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🎭 Deploying Mock Protocols to Base Sepolia...\n");

    const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const deployments = {};

    // 1. Deploy Mock Aerodrome Pool
    console.log("1️⃣ Deploying MockAerodromePool...");
    const MockAerodromePool = await hre.ethers.getContractFactory("MockAerodromePool");
    const aeroPool = await MockAerodromePool.deploy(USDC_SEPOLIA, USDC_SEPOLIA);
    await aeroPool.waitForDeployment();
    const aeroPoolAddress = await aeroPool.getAddress();
    console.log(`   ✅ MockAerodromePool: ${aeroPoolAddress}\n`);
    deployments.MockAerodromePool = aeroPoolAddress;

    // 2. Deploy Mock Beefy Vault
    console.log("2️⃣ Deploying MockBeefyVault...");
    const MockBeefyVault = await hre.ethers.getContractFactory("MockBeefyVault");
    const beefyVault = await MockBeefyVault.deploy(
        USDC_SEPOLIA,
        "Mock Beefy USDC Vault",
        "mooUSDC"
    );
    await beefyVault.waitForDeployment();
    const beefyVaultAddress = await beefyVault.getAddress();
    console.log(`   ✅ MockBeefyVault: ${beefyVaultAddress}\n`);
    deployments.MockBeefyVault = beefyVaultAddress;

    // 3. Deploy Mock Aave Pool
    console.log("3️⃣ Deploying MockAaveLendingPool...");
    const MockAavePool = await hre.ethers.getContractFactory("MockAaveLendingPool");
    const aavePool = await MockAavePool.deploy(USDC_SEPOLIA);
    await aavePool.waitForDeployment();
    const aavePoolAddress = await aavePool.getAddress();
    console.log(`   ✅ MockAaveLendingPool: ${aavePoolAddress}\n`);
    deployments.MockAaveLendingPool = aavePoolAddress;

    // Save deployment info
    const deploymentInfo = {
        network: "baseSepolia",
        timestamp: new Date().toISOString(),
        usdc: USDC_SEPOLIA,
        mocks: deployments,
    };

    const outputPath = path.join(__dirname, "../deployments/mock-protocols-sepolia.json");
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("═".repeat(70));
    console.log("📄 MOCK PROTOCOLS DEPLOYMENT SUMMARY");
    console.log("═".repeat(70));
    console.log(`Network: Base Sepolia`);
    console.log(`USDC Token: ${USDC_SEPOLIA}`);
    console.log("");
    console.log("Deployed Mock Protocols:");
    console.log(`  • Aerodrome Pool: ${aeroPoolAddress}`);
    console.log(`  • Beefy Vault:    ${beefyVaultAddress}`);
    console.log(`  • Aave Pool:      ${aavePoolAddress}`);
    console.log("");
    console.log(`💾 Deployment data saved to:`);
    console.log(`   ${outputPath}`);
    console.log("═".repeat(70));
    console.log("");
    console.log("✅ All 3 mock protocols successfully deployed!");
    console.log("");
    console.log("🎯 These mocks simulate:");
    console.log("   • Aerodrome: 12.5% APY (fake yield)");
    console.log("   • Beefy: 6.8% APY (auto-compound simulation)");
    console.log("   • Aave: 3.8% APY (lending simulation)");
    console.log("");
    console.log("💡 Next step: Test deposits/withdrawals with fake USDC!");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
