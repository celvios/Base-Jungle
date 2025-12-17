const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const POINTS_TRACKER_ADDRESS = deploymentData.contracts.pointsTracker;
    const USER_ADDRESS = "0x72377a60870E3d2493F871FA5792a1160518fcc6"; // User

    console.log(`🔍 EVENT SCANNER for ${USER_ADDRESS}`);
    console.log(`   Contract: ${POINTS_TRACKER_ADDRESS}`);

    const tracker = await ethers.getContractAt([
        "event PointsUpdated(address indexed user, uint256 amount, string reason)",
        "function userPoints(address) view returns (uint256, uint256, uint256)"
    ], POINTS_TRACKER_ADDRESS);

    // 1. Check Current Sate
    try {
        const [pts, last, pending] = await tracker.userPoints(USER_ADDRESS);
        console.log(`\n📊 CURRENT STATE (V2 ABI):`);
        console.log(`   Total Points: ${pts.toString()}`);
    } catch (e) {
        console.log("   could not read state V2");
    }

    // 2. Scan Events
    const currentBlock = await ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 10000); // Look back 10k blocks (~1 hour on Base?) No, Base is 2s block. 10k = 20k sec = 5 hours.

    console.log(`\n🕵️ Scanning blocks ${startBlock} to ${currentBlock} for 'PointsUpdated'...`);

    const filter = tracker.filters.PointsUpdated(USER_ADDRESS);
    const events = await tracker.queryFilter(filter, startBlock, currentBlock);

    console.log(`   found ${events.length} events.`);

    if (events.length > 0) {
        events.forEach((e, i) => {
            console.log(`   [${i}] Block ${e.blockNumber}: +${e.args.amount.toString()} (${e.args.reason})`);
        });
    } else {
        console.log("   ❌ NO PointsUpdated events found for this user.");
    }

    // 3. Scan for "AmountTooSmall" if that event exists?
    // ABI: event AmountTooSmall(address indexed user, uint256 amount);
    // Let's add it to contract interface
    const trackerWithError = await ethers.getContractAt([
        "event AmountTooSmall(address indexed user, uint256 amount)"
    ], POINTS_TRACKER_ADDRESS);

    const errFilter = trackerWithError.filters.AmountTooSmall(USER_ADDRESS);
    const errEvents = await trackerWithError.queryFilter(errFilter, startBlock, currentBlock);

    if (errEvents.length > 0) {
        console.log(`\n⚠️ FOUND 'AmountTooSmall' FAILURES:`);
        errEvents.forEach((e, i) => {
            console.log(`   [${i}] Block ${e.blockNumber}: Tried to award ${e.args.amount.toString()} (Too Small)`);
        });
    }
}

main().catch(console.error);
