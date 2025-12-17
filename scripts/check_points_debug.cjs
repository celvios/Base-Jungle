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
        "function getUserTierInfo(address user) view returns (uint8 tier, uint256 multiplier, uint256 maxLeverage, uint256 activeReferrals, uint256 totalReferrals)",
        "function getReferrer(address user) view returns (address)"
    ];

    console.log(`\n🔍 CHECKING STATUS FOR: ${USER_ADDRESS}`);
    console.log("═══════════════════════════════════════════════════════\n");

    const pointsContract = await ethers.getContractAt(POINTS_TRACKER_ABI, POINTS_TRACKER_ADDRESS);
    const referralContract = await ethers.getContractAt(REFERRAL_MANAGER_ABI, REFERRAL_MANAGER_ADDRESS);

    // 1. Check Points
    try {
        const [totalPoints, lastUpdated] = await pointsContract.userPoints(USER_ADDRESS);

        console.log("🏆 POINTS TRACKER");
        console.log(`   Total Points: ${totalPoints.toString()}`);
        console.log(`   Last Updated: ${new Date(Number(lastUpdated) * 1000).toLocaleString()}`);
        console.log(`   Contract: ${POINTS_TRACKER_ADDRESS}`);
    } catch (error) {
        console.error("❌ Error fetching points:", error.message);
    }

    // 2. Check Referrals
    try {
        const [tier, multiplier, maxLev, activeRefs, totalRefs] = await referralContract.getUserTierInfo(USER_ADDRESS);
        const referrer = await referralContract.getReferrer(USER_ADDRESS);

        const tiers = ["Novice", "Scout", "Captain", "Whale"];

        console.log("\n👥 REFERRAL MANAGER");
        console.log(`   Current Tier: ${tiers[tier]} (${tier})`);
        console.log(`   Active Referrals: ${activeRefs.toString()}`);
        console.log(`   Total Referrals: ${totalRefs.toString()}`);
        console.log(`   Multiplier: ${multiplier.toString()} (${Number(multiplier) / 100}x)`);
        console.log(`   Referred By: ${referrer === ethers.ZeroAddress ? "None" : referrer}`);
    } catch (error) {
        console.error("❌ Error fetching referral info:", error.message);
    }

    console.log("\n═══════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
