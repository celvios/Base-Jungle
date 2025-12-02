import { useMemo } from 'react';
import { useDirectReferrals, useUserTier } from './use-referrals';
import { useVaultBalance } from './use-vault';
import { type Address } from 'viem';

export interface ReferralMetadata {
    address: Address;
    tier: string;
    status: 'active' | 'risk' | 'inactive';
    lastActive: string;
}

export function useReferralMetadata(userAddress: Address | undefined) {
    const { data: directReferrals, isLoading: loadingReferrals } = useDirectReferrals(userAddress);

    // TODO: Batch fetch tier and balance for each referral
    // For now, we'll return mock metadata since we can't efficiently batch-fetch on-chain data
    // This should be replaced with an API endpoint that returns enriched referral data

    return useMemo(() => {
        if (!directReferrals || directReferrals.length === 0) {
            return {
                data: [],
                isLoading: loadingReferrals,
            };
        }

        // Mock metadata for demonstration
        // TODO: Replace with real API call to backend that aggregates:
        // - getUserTier(address) for each referral
        // - getVaultBalance(address) to determine active status
        // - Last transaction timestamp from indexer
        const mockMetadata: ReferralMetadata[] = directReferrals.map((addr, index) => ({
            address: addr,
            tier: 'Novice', // TODO: Fetch real tier
            status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'risk' : 'inactive',
            lastActive: index % 3 === 0 ? '2h ago' : index % 3 === 1 ? '5d ago' : '30d ago',
        }));

        return {
            data: mockMetadata,
            isLoading: loadingReferrals,
        };
    }, [directReferrals, loadingReferrals]);
}
