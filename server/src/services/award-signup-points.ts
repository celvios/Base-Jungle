import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const POINTS_TRACKER_ABI = [
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'reason', type: 'string' }
        ],
        name: 'updatePoints',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

const RPC_URL = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC;
const POINTS_TRACKER_ADDRESS = process.env.POINTS_TRACKER_ADDRESS!;
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

async function awardSignupPoints(userAddress: string, points: number = 1000) {
    try {
        if (!PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not found in environment variables');
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log(`\n🎁 Awarding ${points} signup points to ${userAddress}...`);
        console.log(`📄 PointsTracker: ${POINTS_TRACKER_ADDRESS}`);
        console.log(`👤 Admin wallet: ${wallet.address}\n`);

        const pointsContract = new ethers.Contract(
            POINTS_TRACKER_ADDRESS,
            POINTS_TRACKER_ABI,
            wallet
        );

        const tx = await pointsContract.updatePoints(
            userAddress,
            ethers.parseEther(points.toString()),
            'signup_bonus'
        );

        console.log(`⏳ Transaction sent: ${tx.hash}`);
        console.log(`⌛ Waiting for confirmation...`);

        const receipt = await tx.wait();

        console.log(`✅ Points awarded successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);
        console.log(`🎉 ${userAddress} now has ${points} signup points!`);
        console.log(`📊 Run 'npm run sync' to update the leaderboard\n`);

        return receipt;
    } catch (error: any) {
        console.error(`\n❌ Error awarding points:`, error.message);
        if (error.message.includes('UPDATER_ROLE')) {
            console.error(`\n⚠️  Your wallet doesn't have the UPDATER_ROLE on the PointsTracker contract.`);
            console.error(`   Please grant it using the contract's grantRole function.\n`);
        }
        throw error;
    }
}

// Run the script
if (require.main === module) {
    const userAddress = process.argv[2] || '0x72377a60870E3d2493F871FA5792a1160518fcc6';
    const points = parseInt(process.argv[3] || '1000');

    awardSignupPoints(userAddress, points)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { awardSignupPoints };
