import { updateUserData, recalculateRankings } from './ranking';

async function seedTestData() {
    console.log('\n🌱 Seeding test data for leaderboard...\n');

    // Your actual wallet address
    await updateUserData(
        '0x72377a60870E3d2493F871FA5792a1160518fcc6',
        15000,  // 15,000 points
        2,      // Tier 2 (Explorer)
        5,      // 5 direct referrals
        12      // 12 indirect referrals
    );

    // Mock user 2
    await updateUserData(
        '0x1234567890123456789012345678901234567890',
        25000,  // 25,000 points
        3,      // Tier 3 (Captain)
        10,     // 10 direct referrals
        25      // 25 indirect referrals
    );

    // Mock user 3
    await updateUserData(
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        8000,   // 8,000 points
        1,      // Tier 1 (Novice)
        2,      // 2 direct referrals
        4       // 4 indirect referrals
    );

    await recalculateRankings();

    console.log('✅ Test data seeded successfully!\n');
    console.log('📊 Leaderboard now has 3 users');
    console.log('🌐 Check /leaderboard to see the data\n');
}

if (require.main === module) {
    seedTestData()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Error seeding data:', err);
            process.exit(1);
        });
}
