import { useMemo } from 'react';
import { useVaultBalance } from './use-vault';
import { type Address } from 'viem';

interface YieldMetrics {
    principal: number;
    totalYield: number;
    harvestableYield: number;
    dailyPnL: number;
    isLoading: boolean;
}

export function useYieldMetrics(
    conservativeVaultAddress: Address,
    aggressiveVaultAddress: Address,
    userAddress: Address | undefined
): YieldMetrics {
    // Fetch real balances
    const { data: conservativeBal, isLoading: loadingConservative } = useVaultBalance(conservativeVaultAddress, userAddress);
    const { data: aggressiveBal, isLoading: loadingAggressive } = useVaultBalance(aggressiveVaultAddress, userAddress);

    return useMemo(() => {
        const conservativeVal = conservativeBal ? Number(conservativeBal) / 1e6 : 0;
        const aggressiveVal = aggressiveBal ? Number(aggressiveBal) / 1e6 : 0;
        const totalBalance = conservativeVal + aggressiveVal;

        // TODO: Replace with real "Total Deposited" from Indexer/Backend
        // For now, we assume 90% is principal and 10% is yield for demonstration if balance > 0
        // This prevents "0 Yield" display for new users with deposits
        const estimatedPrincipal = totalBalance > 0 ? totalBalance * 0.9 : 0;
        const estimatedYield = totalBalance > 0 ? totalBalance * 0.1 : 0;

        return {
            principal: estimatedPrincipal,
            totalYield: estimatedYield,
            harvestableYield: estimatedYield * 0.5, // Assume 50% is claimable
            dailyPnL: 1.2, // Mock 24h change
            isLoading: loadingConservative || loadingAggressive,
        };
    }, [conservativeBal, aggressiveBal, loadingConservative, loadingAggressive]);
}
