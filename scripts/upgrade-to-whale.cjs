const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🐋 STARTING WHALE ASCENSION PROTOCOL 🐋\n");

    const [deployer] = await hre.ethers.getSigners();
    // Default to deployer, but allow override via env var
    let TARGET_USER = process.env.TARGET_USER || deployer.address;
    TARGET_USER = TARGET_USER.trim();

    if (!hre.ethers.isAddress(TARGET_USER)) {
        throw new Error(`❌ Invalid TARGET_USER address: "${TARGET_USER}". Make sure there are no spaces or quotes.`);
    }

    console.log(`🎯 Target Specimen: ${TARGET_USER}`);
    console.log(`📝 Runner: ${deployer.address}`);

    // Load Deployment
    const networkName = hre.network.name;
    let deploymentPath = `./deployed-addresses-${networkName}.json`;

    // Exact filename match for Base Sepolia
    if (networkName === "baseSepolia" || networkName === "hardhat") {
        deploymentPath = "./deployed-addresses-sepolia.json";
    }

    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`❌ Deployment file not found: ${deploymentPath}`);
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const REFERRAL_MANAGER_ADDR = deploymentData.contracts.referralManager;

    console.log(`📍 ReferralManager: ${REFERRAL_MANAGER_ADDR}`);
    const referralManager = await hre.ethers.getContractAt("ReferralManager", REFERRAL_MANAGER_ADDR);

    // Check Roles
    const ACTIVITY_TRACKER_ROLE = await referralManager.ACTIVITY_TRACKER_ROLE();
    const hasRole = await referralManager.hasRole(ACTIVITY_TRACKER_ROLE, deployer.address);
    if (!hasRole) {
        throw new Error(`❌ Runner ${deployer.address} does not have ACTIVITY_TRACKER_ROLE. Cannot upgrade.`);
    }

    // Check Current Status
    let tierInfo = await referralManager.getUserTierInfo(TARGET_USER);
    let activeRefs = Number(tierInfo.activeReferrals);
    console.log(`📊 Current Active Referrals: ${activeRefs}`);
    console.log(`📊 Current Tier: ${getTierName(tierInfo.tier)}`);

    if (activeRefs >= 50) {
        console.log("✅ User is already a WHALE! No action needed.");
        return;
    }

    const needed = 50 - activeRefs;
    console.log(`⚡ Boosting with ${needed} new active referrals...\n`);

    // Ensure Target has a Code
    let code = await referralManager.userCodes(TARGET_USER);
    if (code === hre.ethers.ZeroHash) {
        const newCode = hre.ethers.keccak256(hre.ethers.solidityPacked(["address", "string"], [TARGET_USER, "WHALE_BOOST"]));
        console.log("creating code for user...");
        const tx = await referralManager.registerCode(newCode);
        await tx.wait();
        code = newCode;
        console.log("✅ Code registered.");
    }

    // BATCH OPERATION
    // We execute in chunks to avoid gas limit issues if necessary, but loop is fine for 50.
    for (let i = 0; i < needed; i++) {
        // Generate random wallet
        const randomWallet = hre.ethers.Wallet.createRandom();
        const childAddress = randomWallet.address;

        process.stdout.write(`   [${i + 1}/${needed}] Processing ${childAddress.slice(0, 8)}... `);

        try {
            // 1. Register Referral
            // Note: registerReferral(user, code)
            const txReg = await referralManager.registerReferral(childAddress, code);
            await txReg.wait();

            // 2. Mark Active
            // Note: markActive(user) - requires Role
            const txAct = await referralManager.markActive(childAddress);
            await txAct.wait();

            process.stdout.write("✅ OK\n");
        } catch (e) {
            process.stdout.write(`❌ FAILED: ${e.message}\n`);
        }
    }

    console.log("\n⏳ Verifying Upgrade...");
    tierInfo = await referralManager.getUserTierInfo(TARGET_USER);
    activeRefs = Number(tierInfo.activeReferrals);

    console.log("════════════════════════════════════");
    console.log(`📊 Final Active Referrals: ${activeRefs}`);
    console.log(`🏆 Final Tier: ${getTierName(tierInfo.tier).toUpperCase()}`);
    console.log("════════════════════════════════════");

    if (activeRefs >= 50) {
        console.log("\n🎉 CONGRATULATIONS! YOU ARE NOW A WHALE. 🐋");
        console.log("   > 1.5x Multiplier Unlocked");
        console.log("   > 5.0x Leverage Unlocked");
        console.log("   > Flash Loan Strategies Unlocked");
    } else {
        console.log("\n⚠️  Upgrade incomplete. Try running again.");
    }
}

function getTierName(tierEnum) {
    const tiers = ["Novice", "Scout", "Captain", "Whale"];
    return tiers[tierEnum] || "Unknown";
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
