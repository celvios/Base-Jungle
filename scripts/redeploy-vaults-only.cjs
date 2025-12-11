const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🚀 REDEPLOYING VAULTS ONLY...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const STRATEGY_CONTROLLER = "0x8F652a77FD1D5371ab1F64aE007458F68b74d13A";
    const REFERRAL_MANAGER = "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
    const TREASURY_MANAGER = "0x87D8EEFfD2529982BE74ac6eDD851BcFcacCFC44";
    const POINTS_TRACKER = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";

    // Deploy ConservativeVault
    console.log("\n📦 Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        MOCK_USDC,
        STRATEGY_CONTROLLER,
        TREASURY_MANAGER,
        REFERRAL_MANAGER,
        POINTS_TRACKER
    );
    await conservativeVault.waitForDeployment();
    const conservativeVaultAddress = await conservativeVault.getAddress();
    console.log("✅ ConservativeVault:", conservativeVaultAddress);

    // Grant VAULT_ROLE
    console.log("\n🔐 Granting VAULT_ROLE...");
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    const VAULT_ROLE = await sc.VAULT_ROLE();
    const grantTx = await sc.grantRole(VAULT_ROLE, conservativeVaultAddress);
    await grantTx.wait();
    console.log("✅ VAULT_ROLE granted!");

    // Grant UPDATER_ROLE on PointsTracker
    console.log("\n🔐 Granting UPDATER_ROLE...");
    const pt = await hre.ethers.getContractAt("PointsTracker", POINTS_TRACKER);
    const UPDATER_ROLE = await pt.UPDATER_ROLE();
    const grantTx2 = await pt.grantRole(UPDATER_ROLE, conservativeVaultAddress);
    await grantTx2.wait();
    console.log("✅ UPDATER_ROLE granted!");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n📝 UPDATE VERCEL:");
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=${conservativeVaultAddress}`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${conservativeVaultAddress}`);
    console.log(`VITE_BASE_VAULT_ADDRESS=${conservativeVaultAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch(console.error);
