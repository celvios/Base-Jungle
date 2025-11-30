import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Activity {
    id: number;
    tx_hash: string;
    block_number: number;
    timestamp: number;
    event_type: 'deposit' | 'withdraw' | 'harvest' | 'strategy_change' | 'referral';
    user_address: string;
    vault_address?: string;
    amount?: number;
    metadata?: any;
    created_at: string;
}

/**
 * Get recent activities for Sonar feed
 */
export function useRecentActivities(limit: number = 50) {
    return useQuery<{ activities: Activity[]; count: number }>({
        queryKey: ['activities', limit],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/activities?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch activities');
            const data = await res.json();
            return data;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refresh every minute
    });
}

/**
 * Get user-specific activity history
 */
export function useUserActivities(address: string | undefined, limit: number = 20) {
    return useQuery<{ activities: Activity[]; count: number }>({
        queryKey: ['user-activities', address, limit],
        queryFn: async () => {
            if (!address) return { activities: [], count: 0 };

            const res = await fetch(`${API_URL}/activities/user/${address}?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch user activities');
            const data = await res.json();
            return data;
        },
        enabled: !!address,
        staleTime: 30000,
    });
}

/**
 * Get activity statistics
 */
export function useActivityStats() {
    return useQuery<{
        total_activities: number;
        unique_users: number;
        total_deposits: number;
        total_withdrawals: number;
        last_activity: number | null;
    }>({
        queryKey: ['activity-stats'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/activities/stats`);
            if (!res.ok) throw new Error('Failed to fetch activity stats');
            const data = await res.json();
            return data;
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 120000, // Refresh every 2 minutes
    });
}
