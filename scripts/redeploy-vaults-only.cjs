const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔄 Redeploying ONLY Vaults (with transfer fix)...\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const STRATEGY_CONTROLLER = "0x48C9310b3139dD5b8D9c05B24B56539c56C27F91";

    // Load existing addresses
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const REFERRAL_MANAGER = deploymentData.contracts.referralManager;
    const POINTS_TRACKER = deploymentData.contracts.pointsTracker;
    const TREASURY_MANAGER = deploymentData.contracts.treasuryManager;

    console.log("📄 Using existing contracts:");
    console.log("   USDC:", MOCK_USDC);
    console.log("   StrategyController:", STRATEGY_CONTROLLER);
    console.log("   ReferralManager:", REFERRAL_MANAGER);
    console.log("   PointsTracker:", POINTS_TRACKER);
    console.log("   TreasuryManager:", TREASURY_MANAGER);

    // Deploy Conservative Vault
    console.log("\n📦 Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        MOCK_USDC,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        STRATEGY_CONTROLLER,
        TREASURY_MANAGER
    );
    await conservativeVault.waitForDeployment();
    const conservativeVaultAddress = await conservativeVault.getAddress();
    console.log("✅ ConservativeVault:", conservativeVaultAddress);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Deploy Aggressive Vault
    console.log("\n📦 Deploying AggressiveVault...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const aggressiveVault = await AggressiveVault.deploy(
        MOCK_USDC,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        STRATEGY_CONTROLLER,
        TREASURY_MANAGER
    );
    await aggressiveVault.waitForDeployment();
    const aggressiveVaultAddress = await aggressiveVault.getAddress();
    console.log("✅ AggressiveVault:", aggressiveVaultAddress);

    // Update deployment data
    deploymentData.contracts.conservativeVault = conservativeVaultAddress;
    deploymentData.contracts.aggressiveVault = aggressiveVaultAddress;
    deploymentData.contracts.masterVault = aggressiveVaultAddress;
    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(deploymentData, null, 2));

    console.log("\n✅ VAULTS REDEPLOYED!");
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 UPDATE VERCEL:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nVITE_CONSERVATIVE_VAULT_ADDRESS=" + conservativeVaultAddress);
    console.log("VITE_AGGRESSIVE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("VITE_BASE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("\n🎉 Ready to test!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

