import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Address } from 'viem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface VaultPosition {
    initialDeposit: number;
    currentValue: number;
    totalYield: number;
    principal: number;
    yield: number;
    depositDate: string;
    daysStaked: number;
}

/**
 * Get user's vault position with principal/yield breakdown
 */
export function useVaultPosition(
    vaultAddress: Address | undefined,
    userAddress: Address | undefined,
    currentShares: bigint | undefined,
    currentValue: bigint | undefined
) {
    return useQuery({
        queryKey: ['vaultPosition', vaultAddress, userAddress, currentShares?.toString(), currentValue?.toString()],
        queryFn: async () => {
            if (!vaultAddress || !userAddress || !currentShares || !currentValue) {
                return null;
            }

            // Convert BigInt to number (shares / 1e18, value / 1e6 USDC)
            const sharesNum = Number(currentShares) / 1e18;
            const valueNum = Number(currentValue) / 1e6;

            const response = await fetch(
                `${API_URL}/vault/${vaultAddress}/user/${userAddress}/position?currentShares=${sharesNum}&currentValue=${valueNum}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch vault position');
            }

            const data = await response.json();
            return data.position as VaultPosition | null;
        },
        enabled: !!vaultAddress && !!userAddress && !!currentShares && !!currentValue,
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Track a deposit (call after successful deposit transaction)
 */
export function useTrackDeposit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            userAddress: Address;
            vaultAddress: Address;
            amount: number;
            shares: number;
            timestamp: number;
            txHash: string;
        }) => {
            const response = await fetch(`${API_URL}/vault/track-deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error('Failed to track deposit');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vaultPosition'] });
            queryClient.invalidateQueries({ queryKey: ['depositHistory'] });
        },
    });
}

/**
 * Track a withdrawal (call after successful withdrawal transaction)
 */
export function useTrackWithdrawal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            userAddress: Address;
            vaultAddress: Address;
            sharesBurned: number;
            assetsReceived: number;
            timestamp: number;
            txHash: string;
            wasMature: boolean;
            penalty: number;
        }) => {
            const response = await fetch(`${API_URL}/vault/track-withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error('Failed to track withdrawal');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vaultPosition'] });
            queryClient.invalidateQueries({ queryKey: ['withdrawalHistory'] });
        },
    });
}
