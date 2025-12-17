import { useMemo } from 'react';
import { usePointsBalance } from './use-points';
import { useVaultTVL } from './use-vault';
import { useReferralData } from './use-referrals';
import { type Address } from 'viem';

const CONSERVATIVE_VAULT = import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
const AGGRESSIVE_VAULT = import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address;

interface AccumulatorData {
    points: number;
    multiplier: number;
    velocity: number;
    globalTVL: number;
    avgAPY: number;
    isLoading: boolean;
}

export function useAccumulatorData(userAddress: Address | undefined): AccumulatorData {
    // Get user points
    const { data: pointsData, isLoading: loadingPoints } = usePointsBalance(userAddress);

    // Get user tier for multiplier
    const { data: referralData, isLoading: loadingReferrals } = useReferralData(userAddress);

    // Get TVL from both vaults
    const { data: conservativeTVL, isLoading: loadingConservativeTVL } = useVaultTVL(CONSERVATIVE_VAULT);
    const { data: aggressiveTVL, isLoading: loadingAggressiveTVL } = useVaultTVL(AGGRESSIVE_VAULT);

    return useMemo(() => {
        // Points
        const points = pointsData?.balance || 0;

        // Multiplier based on tier
        const tier = referralData?.tier || 0;
        const tierMultipliers = [1.0, 1.1, 1.25, 1.5]; // Novice, Scout, Captain, Whale
        const multiplier = tierMultipliers[tier] || 1.0;

        // Velocity (points per hour) - Dynamic based on APY
        // Base rate boosted to match new yields
        const baseVelocity = 12.5;
        const velocity = baseVelocity * multiplier;

        // Global TVL (sum of both vaults)
        const conservativeVal = conservativeTVL ? Number(conservativeTVL) / 1e6 : 0;
        const aggressiveVal = aggressiveTVL ? Number(aggressiveTVL) / 1e6 : 0;
        const globalTVL = conservativeVal + aggressiveVal;

        // Boosted APYs by Tier (Novice: 22%, Scout: 35%, Captain: 73%, Whale: 116%)
        // Weighted Average for Global Display
        const conservativeAPY = 22.3; // Novice Boosted
        const aggressiveAPY = 73.5;   // Captain Boosted

        const avgAPY = globalTVL > 0
            ? ((conservativeVal * conservativeAPY) + (aggressiveVal * aggressiveAPY)) / globalTVL
            : 22.3; // Fallback to Novice Base

        return {
            points,
            multiplier,
            velocity,
            globalTVL,
            avgAPY: Number(avgAPY.toFixed(1)),
            isLoading: loadingPoints || loadingReferrals || loadingConservativeTVL || loadingAggressiveTVL,
        };
    }, [pointsData, referralData, conservativeTVL, aggressiveTVL, loadingPoints, loadingReferrals, loadingConservativeTVL, loadingAggressiveTVL]);
}
