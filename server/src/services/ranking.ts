import { dbRun, dbGet, dbAll } from '../db/database';

interface LeaderboardEntry {
    address: string;
    points: number;
    tier: number;
    rank: number;
    direct_referrals?: number;
    indirect_referrals?: number;
}

interface Stats {
    total_users: number;
    total_points: number;
    average_points: number;
    highest_points: number;
}

export async function getLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    return dbAll(
        `SELECT address, points, tier, rank, direct_referrals, indirect_referrals
     FROM users
     WHERE points > 0
     ORDER BY rank ASC
     LIMIT ? OFFSET ?`,
        [limit, offset]
    ) as Promise<LeaderboardEntry[]>;
}

export async function getUserRank(address: string) {
    const result = await dbGet(
        `SELECT 
      address, 
      points, 
      tier, 
      rank,
      direct_referrals,
      indirect_referrals,
      (SELECT COUNT(*) FROM users WHERE points > 0) as total_users
     FROM users
     WHERE LOWER(address) = LOWER(?)`,
        [address]
    );

    return result;
}

export async function getStats(): Promise<Stats> {
    const stats = await dbGet(
        `SELECT 
      COUNT(*) as total_users,
      SUM(points) as total_points,
      AVG(points) as average_points,
      MAX(points) as highest_points
     FROM users
     WHERE points > 0`
    ) as Stats | undefined;

    return stats || {
        total_users: 0,
        total_points: 0,
        average_points: 0,
        highest_points: 0
    };
}

export async function updateUserData(
    address: string,
    points: number,
    tier: number,
    directReferrals: number,
    indirectReferrals: number
) {
    await dbRun(
        `INSERT INTO users (address, points, tier, direct_referrals, indirect_referrals, last_updated)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(address) 
     DO UPDATE SET 
       points = ?,
       tier = ?,
       direct_referrals = ?,
       indirect_referrals = ?,
       last_updated = CURRENT_TIMESTAMP`,
        [address.toLowerCase(), points, tier, directReferrals, indirectReferrals, points, tier, directReferrals, indirectReferrals]
    );
}

export async function recalculateRankings() {
    await dbRun(
        `UPDATE users
     SET rank = (
       SELECT COUNT(DISTINCT u2.points) + 1
       FROM users u2
       WHERE u2.points > users.points
     )
     WHERE points > 0`
    );

    console.log('✅ Rankings recalculated');
}
