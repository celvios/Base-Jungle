const { ethers } = require("ethers");

async function main() {
    const POINTS_TRACKER_ADDRESS = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";
    const USER_ADDRESS = "0x72377a60870E3d2493F871FA5792a1160518fcc6";

    const POINTS_TRACKER_ABI = [
        "function userPoints(address user) view returns (uint256 points, uint256 lastUpdated)",
        "function claimDailyPoints() external"
    ];

    console.log(`Checking points for ${USER_ADDRESS} on contract ${POINTS_TRACKER_ADDRESS}...`);

    // Connect to provider (Hardhat will use the configured network, we'll specify baseSepolia)
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const contract = new ethers.Contract(POINTS_TRACKER_ADDRESS, POINTS_TRACKER_ABI, provider);

    try {
        const [points, lastUpdated] = await contract.userPoints(USER_ADDRESS);
        console.log(`\nResults:`);
        console.log(`Points (Wei): ${points.toString()}`);
        console.log(`Points (Formatted): ${ethers.formatUnits(points, 18)}`);
        console.log(`Last Updated: ${new Date(Number(lastUpdated) * 1000).toLocaleString()}`);
    } catch (error) {
        console.error("Error fetching points:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
