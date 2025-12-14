const hre = require("hardhat");

async function main() {
    console.log("🚀 Adding Aerodrome Strategy to Controller...");

    const [deployer] = await hre.ethers.getSigners();

    // Addresses (Update these after deployment!)
    const LP_ADAPTER = "YOUR_DEPLOYED_LP_ADAPTER_ADDRESS";
    const STRATEGY_CONTROLLER = "YOUR_STRATEGY_CONTROLLER_ADDRESS";

    if (LP_ADAPTER === "YOUR_DEPLOYED_LP_ADAPTER_ADDRESS") {
        console.error("❌ Please update LP_ADAPTER address in script");
        process.exit(1);
    }

    const controller = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);

    // Add Strategy: 
    // - Adapter: LP_ADAPTER
    // - Min Tier: 1 (Novice)
    // - Max Allocation: 7000 (70%)
    const tx = await controller.addStrategy(
        LP_ADAPTER,
        1,
        7000
    );

    console.log("Adding strategy... TX:", tx.hash);
    await tx.wait();

    console.log("✅ Aerodrome Strategy Added!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
