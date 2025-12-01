import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@/config/api';
import { useAccount } from 'wagmi';

interface LeaderboardEntry {
    address: string;
    points: number;
    tier: number;
    rank: number;
    direct_referrals?: number;
    indirect_referrals?: number;
}

interface UserRankData {
    address: string;
    points: number;
    tier: number;
    rank: number;
    total_users: number;
    direct_referrals: number;
    indirect_referrals: number;
}

interface LeaderboardStats {
    total_users: number;
    total_points: number;
    average_points: number;
    highest_points: number;
}

export function useLeaderboard(limit: number = 100, offset: number = 0) {
    const { address } = useAccount();

    return useQuery<{ leaderboard: LeaderboardEntry[]; count: number }>({
        queryKey: ['leaderboard', limit, offset, address],
        queryFn: async () => {
            const syncParam = address ? `&syncAddress=${address}` : '';
            const res = await fetch(`${API_CONFIG.baseURL}/api/leaderboard?limit=${limit}&offset=${offset}${syncParam}`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            const data = await res.json();
            return data;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refresh every minute
    });
}

export function useUserRank(address: string | undefined) {
    return useQuery<UserRankData | null>({
        queryKey: ['userRank', address],
        queryFn: async () => {
            if (!address) return null;

            const res = await fetch(`${API_CONFIG.baseURL}/api/user/${address}/points`);
            if (res.status === 404) return null; // User not in system yet
            if (!res.ok) throw new Error('Failed to fetch user rank');

            const data = await res.json();
            return {
                address,
                points: data.totalPoints,
                tier: ['Novice', 'Scout', 'Captain', 'Whale'].indexOf(data.rank),
                rank: data.rank, // Using rank name as rank for now, or fetch actual numeric rank if available
                total_users: 0, // Placeholder
                direct_referrals: 0,
                indirect_referrals: 0
            };
        },
        enabled: !!address,
        staleTime: 30000,
        refetchInterval: 60000,
    });
}

export function useLeaderboardStats() {
    return useQuery<LeaderboardStats>({
        queryKey: ['leaderboardStats'],
        queryFn: async () => {
            const res = await fetch(`${API_CONFIG.baseURL}/api/stats`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard stats');
            const data = await res.json();
            return data;
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 120000, // Refresh every 2 minutes
    });
}
