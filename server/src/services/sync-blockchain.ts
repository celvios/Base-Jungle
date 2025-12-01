import { ethers } from 'ethers';
import { updateUserData, recalculateRankings } from './ranking';
import dotenv from 'dotenv';

dotenv.config();

const POINTS_TRACKER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'userPoints',
        outputs: [
            { name: 'totalPoints', type: 'uint256' },
            { name: 'lastClaimTimestamp', type: 'uint256' },
            { name: 'pendingDailyPoints', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const REFERRAL_REGISTRY_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReferralCount',
        outputs: [{ name: 'direct', type: 'uint256' }, { name: 'indirect', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getUserTier',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const RPC_URL = process.env.RPC_URL!;
const POINTS_TRACKER_ADDRESS = process.env.POINTS_TRACKER_ADDRESS!;
const REFERRAL_REGISTRY_ADDRESS = process.env.REFERRAL_REGISTRY_ADDRESS!;

console.log('🔍 Loaded addresses:');
console.log('   POINTS_TRACKER:', POINTS_TRACKER_ADDRESS);
console.log('   REFERRAL_REGISTRY:', REFERRAL_REGISTRY_ADDRESS);

export async function syncUserData(address: string) {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        const pointsContract = new ethers.Contract(
            POINTS_TRACKER_ADDRESS,
            POINTS_TRACKER_ABI,
            provider
        );

        const referralContract = new ethers.Contract(
            REFERRAL_REGISTRY_ADDRESS,
            REFERRAL_REGISTRY_ABI,
            provider
        );

        // Fetch points data (required)
        const pointsData = await pointsContract.userPoints(address);
        const points = Number(pointsData[0]) / 1e18; // Convert from wei

        // Fetch referral data (optional - default to 0 if not registered)
        let directReferrals = 0;
        let indirectReferrals = 0;
        let userTier = 0;

        try {
            const [referralCounts, tier] = await Promise.all([
                referralContract.getReferralCount(address),
                referralContract.getUserTier(address),
            ]);
            directReferrals = Number(referralCounts[0]);
            indirectReferrals = Number(referralCounts[1]);
            userTier = Number(tier);
        } catch (referralError) {
            console.log(`   ⚠️  No referral data for ${address.slice(0, 6)}...${address.slice(-4)} (not registered in referral system)`);
        }

        // Update database
        await updateUserData(
            address,
            Math.floor(points),
            userTier,
            directReferrals,
            indirectReferrals
        );

        console.log(`✅ Synced ${address.slice(0, 6)}...${address.slice(-4)} - ${points.toFixed(0)} points, Tier ${userTier}`);

        return { points, tier: userTier, directReferrals, indirectReferrals };
    } catch (error: any) {
        console.error(`❌ Error syncing ${address}:`, error.message);
        throw error;
    }
}

export async function syncAllKnownUsers(addresses: string[]) {
    console.log(`\n🔄 Syncing ${addresses.length} addresses from blockchain...\n`);

    let synced = 0;
    for (const address of addresses) {
        try {
            await syncUserData(address);
            synced++;
        } catch (error) {
            console.log(`⏭️  Skipped ${address.slice(0, 6)}... (error fetching data)`);
        }
    }

    // Recalculate rankings after all updates
    await recalculateRankings();

    console.log(`\n✅ Sync complete: ${synced}/${addresses.length} users synced`);
    console.log(`📊 Rankings recalculated\n`);
}

// Manual sync script
if (require.main === module) {
    // 🎯 ADD YOUR WALLET ADDRESS HERE!
    // This should be the address you use to connect to the app
    const addresses = [
        '0x72377a60870E3d2493F871FA5792a1160518fcc6', // Main user
        // Add more addresses if you want (other users, test accounts, etc.)
    ];

    console.log('\n🚀 Starting blockchain data sync...');
    console.log(`📍 Network: Base Sepolia`);
    console.log(`📄 Addresses to sync: ${addresses.length}\n`);

    syncAllKnownUsers(addresses)
        .then(() => {
            console.log('✅ All done! Your data is in the database.');
            console.log('🌐 Start the frontend and check /leaderboard\n');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ Sync failed:', err.message);
            console.error('Make sure your RPC_URL and contract addresses are correct in .env\n');
            process.exit(1);
        });
}
