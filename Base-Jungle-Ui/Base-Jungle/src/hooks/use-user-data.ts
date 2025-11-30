import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/wallet-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface UserData {
    address: string;
    tier: string;
    totalDeposits: string;
    totalPoints: string;
    activeReferrals: number;
    autoCompound?: boolean;
    riskLevel?: string;
    leverageMultiplier?: number;
}

interface VaultBalance {
    vault: string;
    balance: string;
    shareBalance: string;
}

interface LeaderboardEntry {
    rank: number;
    address: string;
    points: string;
    tier: string;
    referrals: number;
}

export function useUserData() {
    const { address, isAuthenticated } = useWallet();
    const token = localStorage.getItem('auth_token');

    return useQuery({
        queryKey: ['user', address],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    query: `
            query GetUser($address: String!) {
              user(address: $address) {
                address
                tier
                totalDeposits
                totalPoints
                activeReferrals
                autoCompound
                riskLevel
                leverageMultiplier
              }
            }
          `,
                    variables: { address },
                }),
            });

            const { data } = await response.json();
            return data.user as UserData;
        },
        enabled: !!address && isAuthenticated,
        staleTime: 10000, // 10 seconds
    });
}

export function useVaultBalances() {
    const { address, isAuthenticated } = useWallet();
    const token = localStorage.getItem('auth_token');

    return useQuery({
        queryKey: ['vaultBalances', address],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    query: `
            query GetVaultBalances($address: String!) {
              user(address: $address) {
                vaultBalances {
                  vault
                  balance
                  shareBalance
                }
              }
            }
          `,
                    variables: { address },
                }),
            });

            const { data } = await response.json();
            return data.user?.vaultBalances as VaultBalance[] || [];
        },
        enabled: !!address && isAuthenticated,
        staleTime: 5000,
    });
}

export function useLeaderboard(limit = 50, offset = 0) {
    return useQuery({
        queryKey: ['leaderboard', limit, offset],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
            query GetLeaderboard($limit: Int, $offset: Int) {
              leaderboard(limit: $limit, offset: $offset) {
                rankings {
                  rank
                  address
                  points
                  tier
                  referrals
                }
                total
              }
            }
          `,
                    variables: { limit, offset },
                }),
            });

            const { data } = await response.json();
            return data.leaderboard;
        },
        staleTime: 30000, // 30 seconds
    });
}

export function useSystemHealth() {
    return useQuery({
        queryKey: ['systemHealth'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
            query GetSystemHealth {
              systemHealth {
                vaultsActive
                keepersRunning
                oracleFeedsHealthy
                lastHarvest
              }
            }
          `,
                }),
            });

            const { data } = await response.json();
            return data.systemHealth;
        },
        staleTime: 60000, // 1 minute
        refetchInterval: 60000,
    });
}
