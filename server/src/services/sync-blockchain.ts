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

        // Fetch data from contracts
        const [pointsData, referralCounts, tier] = await Promise.all([
            pointsContract.userPoints(address),
            referralContract.getReferralCount(address),
            referralContract.getUserTier(address),
        ]);

        const points = Number(pointsData[0]) / 1e18; // Convert from wei
        const directReferrals = Number(referralCounts[0]);
        const indirectReferrals = Number(referralCounts[1]);
        const userTier = Number(tier);

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
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // User 1
        '0x1234567890abcdef1234567890abcdef12345678', // User 2
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // User 3
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
