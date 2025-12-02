import { useMemo } from 'react';
import { TIER_LEVELS, getTierByName, getNextTier } from '@/constants/tiers';

interface NextTierData {
    currentTier: string;
    nextTierName: string | null;
    depositRequirement: number;
    referralRequirement: number;
    depositProgress: number;
    referralProgress: number;
    isMaxTier: boolean;
}

export function useNextTier(
    currentTierName: string,
    currentDeposit: number,
    currentReferrals: number
): NextTierData {
    return useMemo(() => {
        const nextTier = getNextTier(currentTierName);

        if (!nextTier) {
            return {
                currentTier: currentTierName,
                nextTierName: null,
                depositRequirement: 0,
                referralRequirement: 0,
                depositProgress: 100,
                referralProgress: 100,
                isMaxTier: true,
            };
        }

        const depositProgress = Math.min((currentDeposit / nextTier.minDeposit) * 100, 100);
        const referralProgress = Math.min((currentReferrals / nextTier.minReferrals) * 100, 100);

        return {
            currentTier: currentTierName,
            nextTierName: nextTier.name,
            depositRequirement: nextTier.minDeposit,
            referralRequirement: nextTier.minReferrals,
            depositProgress,
            referralProgress,
            isMaxTier: false,
        };
    }, [currentTierName, currentDeposit, currentReferrals]);
}
