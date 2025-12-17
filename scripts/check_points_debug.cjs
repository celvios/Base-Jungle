const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const POINTS_TRACKER_ADDRESS = deploymentData.contracts.pointsTracker;
    const REFERRAL_MANAGER_ADDRESS = deploymentData.contracts.referralManager;

    const [deployer] = await ethers.getSigners();
    const USER_ADDRESS = deployer.address;

    const POINTS_TRACKER_ABI = [
        "function userPoints(address user) view returns (uint256 points, uint256 lastUpdated, uint256 pendingDailyPoints)",
        "function claimDailyPoints(uint256 tokenId) external"
    ];

    const REFERRAL_MANAGER_ABI = [
        "function getUserTier(address user) view returns (uint8)",
        "function getReferrer(address user) view returns (address)"
    ];

    const VAULT_ADDRESS = deploymentData.contracts.conservativeVault;
    const VAULT_ABI = ["event Deposited(address indexed user, uint256 assets, uint256 shares, uint256 fee)"];

    console.log(`\n🔍 SCANNING FOR RECENT DEPOSITORS in Vault: ${VAULT_ADDRESS}`);
    const vaultContract = await ethers.getContractAt(VAULT_ABI, VAULT_ADDRESS);

    // Scan last 5000 blocks
    const currentBlock = await ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 5000);
    console.log(`   Scanning blocks ${startBlock} to ${currentBlock}...`);

    const events = await vaultContract.queryFilter("Deposited", startBlock, currentBlock);
    console.log(`   Found ${events.length} deposit events.\n`);

    const uniqueUsers = [...new Set(events.map(e => e.args.user))];

    const logFile = "debug_output.txt";
    fs.writeFileSync(logFile, `DEBUG REPORT ${new Date().toISOString()}\n\n`);

    // Helper to log to both console and file
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };

    if (uniqueUsers.length === 0) {
        log("❌ No depositors found in recent blocks. Using Deployer address as fallback.");
        uniqueUsers.push(USER_ADDRESS);
    }

    const pointsContract = await ethers.getContractAt(POINTS_TRACKER_ABI, POINTS_TRACKER_ADDRESS);
    const referralContract = await ethers.getContractAt(REFERRAL_MANAGER_ABI, REFERRAL_MANAGER_ADDRESS);

    for (const user of uniqueUsers) {
        log(`\n👤 CHECKING USER: ${user}`);
        log("───────────────────────────────────────────────────────");

        try {
            // Try Standard ABI (3 returns)
            const [totalPoints, lastUpdated, pending] = await pointsContract.userPoints(user);
            log("🏆 POINTS TRACKER (V2 - 3 Returns)");
            log(`   Total Points: ${totalPoints.toString()}`);
            log(`   Last Updated: ${lastUpdated.toString() == "0" ? "Never" : new Date(Number(lastUpdated) * 1000).toLocaleString()}`);
        } catch (e) {
            log("   ⚠️  V3 ABI Failed (" + e.code + "). Trying V1 ABI...");

            // Try Legacy ABI (2 returns)
            const LEGACY_ABI = ["function userPoints(address user) view returns (uint256 points, uint256 lastUpdated)"];
            const legacyContract = await ethers.getContractAt(LEGACY_ABI, POINTS_TRACKER_ADDRESS);
            try {
                const [totalPoints, lastUpdated] = await legacyContract.userPoints(user);
                log("🏆 POINTS TRACKER (V1 - 2 Returns)");
                log(`   Total Points: ${totalPoints.toString()}`);
                log(`   Last Updated: ${lastUpdated.toString() == "0" ? "Never" : new Date(Number(lastUpdated) * 1000).toLocaleString()}`);
            } catch (e2) {
                log("   ❌ ALL Points checks failed: " + e2.message);
            }
        }

        try {
            const tier = await referralContract.getUserTier(user);
            const referrer = await referralContract.getReferrer(user);
            log("👥 REFERRAL MANAGER");
            log(`   Tier: ${["Novice", "Scout", "Captain", "Whale"][tier]} (${tier})`);
            log(`   Msg.Sender of Debug Script: ${USER_ADDRESS}`);
        } catch (e) { log("   ❌ Referee check failed: " + e.message); }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


