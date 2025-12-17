import { useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ReferralManager ABI (Corrected)
const REFERRAL_MANAGER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReferrer',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getUserTierInfo',
        outputs: [
            { name: 'tier', type: 'uint8' },
            { name: 'pointMultiplier', type: 'uint256' },
            { name: 'maxLeverage', type: 'uint256' },
            { name: 'activeReferrals', type: 'uint256' },
            { name: 'totalReferrals', type: 'uint256' }
        ],
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
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'referralInfo',
        outputs: [
            { name: 'referrer', type: 'address' },
            { name: 'directReferrals', type: 'uint256' },
            { name: 'indirectReferrals', type: 'uint256' },
            { name: 'activeDirectReferrals', type: 'uint256' },
            { name: 'registered', type: 'bool' },
            { name: 'isActive', type: 'bool' },
            { name: 'lastActivityTimestamp', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    }
] as const;

// Allow fallback to registry address if manager not set, or hardcoded fallback for dev
const REFERRAL_MANAGER_ADDRESS = (import.meta.env.VITE_REFERRAL_MANAGER_ADDRESS ||
    import.meta.env.VITE_REFERRAL_REGISTRY_ADDRESS) as Address;

// Hook: Get referrer address
export function useReferrerAddress(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_MANAGER_ADDRESS,
        abi: REFERRAL_MANAGER_ABI,
        functionName: 'getReferrer',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress },
    });
}

// Hook: Get detailed tier info
export function useUserTierInfo(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_MANAGER_ADDRESS,
        abi: REFERRAL_MANAGER_ABI,
        functionName: 'getUserTierInfo',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress },
    });
}

// Hook: Get Referral Info Mapping (for indirect count)
export function useReferralInfoMapping(userAddress: Address | undefined) {
    return useReadContract({
        address: REFERRAL_MANAGER_ADDRESS,
        abi: REFERRAL_MANAGER_ABI,
        functionName: 'referralInfo',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress },
    });
}

// Hook: Get direct referrals list (Cannot fetch on-chain, returning empty or mock)
export function useDirectReferrals(userAddress: Address | undefined) {
    // The contract DOES NOT store the list of referees.
    // We would need an indexer (Graph/Subsquid) to fetch this.
    // For now, we return empty structure to satisfy UI.
    return { data: [] as Address[], isLoading: false };
}

// Hook: Get pending bonus (Points are auto-accrued, so always 0)
export function usePendingBonus(userAddress: Address | undefined) {
    return { data: 0n, isLoading: false };
}

// Hook: Claim referral bonus (No-op, points are auto-accrued)
export function useClaimReferralBonus() {
    return {
        claim: () => console.log("Referral bonuses are auto-distributed."),
        isPending: false,
        isConfirming: false,
        isSuccess: true,
        error: null,
        hash: undefined,
    };
}

// Hook: Simplified referral data interface for UI
export function useReferralData(userAddress: Address | undefined) {
    const { data: tierInfo, isLoading: loadingTier } = useUserTierInfo(userAddress);
    const { data: refInfo, isLoading: loadingRefInfo } = useReferralInfoMapping(userAddress);

    const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

    return {
        data: (tierInfo && refInfo) ? {
            directCount: Number(tierInfo[4]), // totalReferrals from struct
            tierTwoCount: Number(refInfo[2]), // indirectReferrals from mapping
            tier: tierNames[Number(tierInfo[0])] || 'Novice',
        } : null,
        isLoading: loadingTier || loadingRefInfo,
    };
}

// Combined hook for referral management
export function useReferralManager(userAddress: Address | undefined) {
    const { data: tierInfo } = useUserTierInfo(userAddress);
    const { data: refInfo } = useReferralInfoMapping(userAddress);

    // API Call for codes (Client-side generation for now)
    const referralCode = userAddress ? userAddress.slice(2, 8).toUpperCase() : "";
    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : "";

    const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

    return {
        directReferrals: tierInfo ? BigInt(tierInfo[4]) : 0n,
        indirectReferrals: refInfo ? BigInt(refInfo[2]) : 0n,
        pendingBonus: 0n,
        tier: tierInfo ? tierNames[Number(tierInfo[0])] : 'Novice',
        referralCode: referralCode,
        referralLink: referralLink,
        referralTree: [],
        claimBonus: () => { },
        isClaiming: false,
    };
}

// Legacy exports if needed
export function useReferralCounts(userAddress: Address | undefined) {
    // Map to new hooks if strictly needed, or just return basic
    return { data: [0n, 0n] as const, isLoading: false };
}
export function useUserTier(userAddress: Address | undefined) {
    // Implementation mapped to useUserTierInfo...
    return { data: 0, isLoading: false };
}

