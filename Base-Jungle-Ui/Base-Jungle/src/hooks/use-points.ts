import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// PointsTracker ABI
const POINTS_TRACKER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'userPoints',
        outputs: [
            { name: 'points', type: 'uint256' },
            { name: 'lastUpdated', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'redeemPoints',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'claimDailyPoints',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

const POINTS_TRACKER_ADDRESS = (import.meta.env.VITE_POINTS_TRACKER_ADDRESS as Address) || '0x3dEDE79F6aD12973e723e67071F17e5C42A93173';

// Hook: Get user points from contract
export function useUserPointsContract(userAddress: Address | undefined) {
    return useReadContract({
        address: POINTS_TRACKER_ADDRESS,
        abi: POINTS_TRACKER_ABI,
        functionName: 'userPoints',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 30000, // Refresh every 30 seconds
        },
    });
}

// Hook: Redeem points
export function useRedeemPoints() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Invalidate queries on success
    useEffect(() => {
        if (isSuccess) {
            queryClient.invalidateQueries({ queryKey: ['userPoints'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    }, [isSuccess, queryClient]);

    const redeem = (amount: string) => {
        const parsedAmount = parseUnits(amount, 18); // Points are 18 decimals
        writeContract({
            address: POINTS_TRACKER_ADDRESS,
            abi: POINTS_TRACKER_ABI,
            functionName: 'redeemPoints',
            args: [parsedAmount],
        });
    };

    return {
        redeem,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Claim daily points
export function useClaimDailyPoints() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Invalidate queries on success
    useEffect(() => {
        if (isSuccess) {
            queryClient.invalidateQueries({ queryKey: ['userPoints'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    }, [isSuccess, queryClient]);

    const claim = () => {
        writeContract({
            address: POINTS_TRACKER_ADDRESS,
            abi: POINTS_TRACKER_ABI,
            functionName: 'claimDailyPoints',
        });
    };

    return {
        claim,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Get points history from API
export function usePointsHistory(userAddress: Address | undefined) {
    const token = localStorage.getItem('auth_token');

    return useQuery({
        queryKey: ['pointsHistory', userAddress],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/user/${userAddress}/points`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch points history');
            }

            return response.json() as Promise<{
                totalPoints: number;
                rank: string;
                dailyPointRate: number;
                pointsHistory: Array<{
                    date: number;
                    points: number;
                    source: string;
                }>;
                nextRankPoints: number;
                nextRankName: string;
            }>;
        },
        enabled: !!userAddress,
        staleTime: 60000, // 1 minute
    });
}

// Combined hook for points management
export function usePointsManager(userAddress: Address | undefined) {
    const { data: contractPoints } = useUserPointsContract(userAddress);
    const { data: historyData } = usePointsHistory(userAddress);
    const { redeem, isPending: isRedeeming } = useRedeemPoints();
    const { claim, isPending: isClaiming } = useClaimDailyPoints();

    return {
        totalPoints: contractPoints?.[0] || 0n,
        lastClaimTimestamp: contractPoints?.[1] || 0n,
        pendingDailyPoints: contractPoints?.[2] || 0n,
        dailyPointRate: historyData?.dailyPointRate || 0,
        rank: historyData?.rank || 'Novice',
        history: historyData?.pointsHistory || [],
        nextRankPoints: historyData?.nextRankPoints || 0,
        nextRankName: historyData?.nextRankName || '',
        redeemPoints: redeem,
        claimDaily: claim,
        isProcessing: isRedeeming || isClaiming,
    };
}

// Helper: Format points
export function formatPoints(points: bigint): string {
    return formatUnits(points, 18);
}

export function usePointsBalance(userAddress: Address | undefined) {
    const { data: contractData, isLoading, error } = useUserPointsContract(userAddress);

    console.log('🔍 Points Debug:', {
        userAddress,
        contractData,
        isLoading,
        error,
        formattedPoints: contractData ? Number(formatPoints(contractData[0])) : null
    });

    return {
        data: contractData ? {
            balance: Number(formatPoints(contractData[0])), // points
            dailyRate: 150, // TODO: Calculate from contract or API
            pending: 0, // No longer returned by contract
        } : null,
        isLoading,
    };
}
