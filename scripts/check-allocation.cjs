const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n💰 MONEY TRACKER: Auditing Your Allocations 💰\n");

    const [deployer] = await hre.ethers.getSigners();
    let TARGET_USER = process.env.TARGET_USER || deployer.address;
    TARGET_USER = TARGET_USER.trim();

    console.log(`👤 User: ${TARGET_USER}`);

    // Load Deployment
    const networkName = hre.network.name;
    let deploymentPath = `./deployed-addresses-${networkName}.json`;
    if (networkName === "baseSepolia" || networkName === "hardhat") {
        deploymentPath = "./deployed-addresses-sepolia.json";
    }

    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`❌ Deployment file not found: ${deploymentPath}`);
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const CONTROLLER_ADDR = deploymentData.contracts.strategyController;
    const REL_MANAGER_ADDR = deploymentData.contracts.referralManager;

    console.log(`📍 Controller: ${CONTROLLER_ADDR}`);

    // Contracts
    const controller = await hre.ethers.getContractAt("StrategyController", CONTROLLER_ADDR);
    const referralManager = await hre.ethers.getContractAt("ReferralManager", REL_MANAGER_ADDR);

    // 1. Check Tier
    const tierInfo = await referralManager.getUserTierInfo(TARGET_USER);
    const tiers = ["Novice", "Scout", "Captain", "Whale"];
    const userTier = tiers[tierInfo.tier];
    console.log(`📊 Current Tier: ${userTier} (${Number(tierInfo.activeReferrals)} Active Refs)`);

    // 2. Check Allocations
    const strategyCount = await controller.strategyCount();
    console.log(`\n🔎 Scanning ${strategyCount} Strategies...\n`);

    const stratTypes = [
        "LENDING", "LEVERAGED_LENDING", "LP_STABLE",
        "LP_VOLATILE", "VAULT_BEEFY", "LEVERAGED_LP", "GAUGE_FARMING"
    ];

    const result = {
        address: TARGET_USER,
        tier: userTier,
        allocations: [],
        total: 0,
        advice: ""
    };

    let totalAllocatedRaw = 0n; // To accumulate raw big number for total

    for (let i = 0; i < strategyCount; i++) {
        const allocated = await controller.userAllocations(TARGET_USER, i);
        const strategy = await controller.strategies(i);

        if (allocated > 0n) {
            const amountFunc = Number(hre.ethers.formatUnits(allocated, 6));
            const typeName = stratTypes[strategy.strategyType] || "UNKNOWN";

            result.allocations.push({
                strategy: typeName,
                balance: amountFunc,
                minTier: tiers[strategy.minTier]
            });
            totalAllocatedRaw += allocated; // Accumulate raw total
        }
    }

    result.total = Number(hre.ethers.formatUnits(totalAllocatedRaw, 6)); // Calculate final total

    if (userTier === "Whale" && totalAllocatedRaw > 0n) {
        // Simple logic: if any allocation is NOT Whale tier, suggest rebalance
        const hasLowTier = result.allocations.some(a => a.minTier !== "Whale");
        if (hasLowTier) {
            result.advice = "Mismatch detected. Funds are in lower-tier strategies. Please deposit or rebalance.";
        } else {
            result.advice = "All funds correctly in Whale strategies.";
        }
    }

    console.log("JSON_OUTPUT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_OUTPUT_END");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
