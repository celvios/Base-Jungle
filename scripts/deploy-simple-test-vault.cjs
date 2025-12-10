const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🧪 Deploying Simple Test Vault...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Mock USDC:", MOCK_USDC);

    // Deploy Simple Test Vault
    console.log("\n📦 Deploying SimpleTestVault...");
    const SimpleTestVault = await hre.ethers.getContractFactory("SimpleTestVault");
    const vault = await SimpleTestVault.deploy(MOCK_USDC);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ SimpleTestVault:", vaultAddress);

    // Test deposit simulation
    console.log("\n🧪 Testing deposit simulation...");
    const USER = deployer.address;
    const depositAmount = hre.ethers.parseUnits("100", 6); // $100

    try {
        const shares = await vault.deposit.staticCall(depositAmount, USER);
        console.log("✅ Deposit simulation PASSED!");
        console.log(`   Would receive: ${hre.ethers.formatUnits(shares, 18)} shares`);
    } catch (error) {
        console.log("❌ Deposit simulation FAILED!");
        console.log("   Error:", error.message);
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 UPDATE VERCEL:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nVITE_CONSERVATIVE_VAULT_ADDRESS=" + vaultAddress);
    console.log("VITE_AGGRESSIVE_VAULT_ADDRESS=" + vaultAddress);
    console.log("VITE_BASE_VAULT_ADDRESS=" + vaultAddress);
    console.log("\n🎉 Test if this simple vault works!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

