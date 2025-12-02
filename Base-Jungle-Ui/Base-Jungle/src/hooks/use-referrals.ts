import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ReferralRegistry ABI
const REFERRAL_REGISTRY_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReferrer',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getDirectReferrals',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReferralCount',
        outputs: [{ name: 'direct', type: 'uint256' }, { name: 'indirect', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'claimReferralBonus',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getPendingBonus',
        outputs: [{ name: '', type: 'uint256' }],
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

const REFERRAL_REGISTRY_ADDRESS = import.meta.env.VITE_REFERRAL_REGISTRY_ADDRESS as Address;

// Hook: Get referrer address
export function useReferrerAddress(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_REGISTRY_ADDRESS,
        abi: REFERRAL_REGISTRY_ABI,
        functionName: 'getReferrer',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get referral counts
export function useReferralCounts(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_REGISTRY_ADDRESS,
        abi: REFERRAL_REGISTRY_ABI,
        functionName: 'getReferralCount',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get direct referrals list
export function useDirectReferrals(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_REGISTRY_ADDRESS,
        abi: REFERRAL_REGISTRY_ABI,
        functionName: 'getDirectReferrals',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get pending bonus
export function usePendingBonus(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_REGISTRY_ADDRESS,
        abi: REFERRAL_REGISTRY_ABI,
        functionName: 'getPendingBonus',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 30000, // Refresh every 30 seconds
        },
    });
}

// Hook: Get user tier
export function useUserTier(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_REGISTRY_ADDRESS,
        abi: REFERRAL_REGISTRY_ABI,
        functionName: 'getUserTier',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Claim referral bonus
export function useClaimReferralBonus() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['pendingBonus'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const claim = () => {
        writeContract({
            address: REFERRAL_REGISTRY_ADDRESS,
            abi: REFERRAL_REGISTRY_ABI,
            functionName: 'claimReferralBonus',
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

// Hook: Get referral info from API (includes tree, link, etc.)
export function useReferralInfo(userAddress: Address | undefined) {
    const token = localStorage.getItem('auth_token');

    return useQuery({
        queryKey: ['referralInfo', userAddress],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/user/${userAddress}/referrals`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch referral info');
            }

            return response.json() as Promise<{
                referralCode: string;
                referralLink: string;
                directReferrals: number;
                indirectReferrals: number;
                activeReferrals: number;
                currentTier: string;
                nextTier: string;
                nextTierRequirement: number;
                totalBonusPoints: number;
                referralTree: Array<{
                    address: string;
                    level: 1 | 2;
                    joinDate: number;
                    isActive: boolean;
                    totalDeposited: number;
                }>;
            }>;
        },
        enabled: !!userAddress,
        staleTime: 60000, // 1 minute
    });
}

// Combined hook for referral management
export function useReferralManager(userAddress: Address | undefined) {
    const { data: counts } = useReferralCounts(userAddress);
    const { data: pendingBonus } = usePendingBonus(userAddress);
    const { data: tier } = useUserTier(userAddress);
    const { data: info } = useReferralInfo(userAddress);
    const { claim, isPending } = useClaimReferralBonus();

    const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

    return {
        directReferrals: counts?.[0] || 0n,
        indirectReferrals: counts?.[1] || 0n,
        pendingBonus: pendingBonus || 0n,
        tier: tier !== undefined ? tierNames[tier] : 'Novice',
        referralCode: info?.referralCode || '',
        referralLink: info?.referralLink || '',
        referralTree: info?.referralTree || [],
        claimBonus: claim,
        isClaiming: isPending,
    };
}

// Hook: Simplified referral data interface
export function useReferralData(userAddress: Address | undefined) {
    const { data: counts, isLoading: loadingCounts } = useReferralCounts(userAddress);
    const { data: tier, isLoading: loadingTier } = useUserTier(userAddress);

    const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

    return {
        data: counts ? {
            directCount: Number(counts[0]),
            tierTwoCount: Number(counts[1]),
            tier: tier !== undefined ? tierNames[tier] : 'Novice',
        } : null,
        isLoading: loadingCounts || loadingTier,
    };
}
