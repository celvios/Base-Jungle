import { updateUserData, recalculateRankings } from './ranking';
import { initializeDatabase } from '../db/database';

// Add mock users for testing the leaderboard
async function addMockUsers() {
    console.log('\n🎭 Adding mock users to leaderboard...\n');

    await initializeDatabase();

    const mockUsers = [
        {
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            points: 15000,
            tier: 3, // Whale
            directReferrals: 12,
            indirectReferrals: 45
        },
        {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            points: 8500,
            tier: 2, // Captain
            directReferrals: 7,
            indirectReferrals: 23
        },
        {
            address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            points: 3200,
            tier: 1, // Scout
            directReferrals: 3,
            indirectReferrals: 8
        }
    ];

    for (const user of mockUsers) {
        await updateUserData(
            user.address,
            user.points,
            user.tier,
            user.directReferrals,
            user.indirectReferrals
        );
        console.log(`✅ Added ${user.address.slice(0, 6)}...${user.address.slice(-4)} - ${user.points} points`);
    }

    await recalculateRankings();

    console.log('\n✅ Mock users added successfully!');
    console.log('📊 Leaderboard populated with 3 users');
    console.log('🌐 Check the leaderboard page to see the results\n');
}

addMockUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('\n❌ Error adding mock users:', err);
        process.exit(1);
    });
