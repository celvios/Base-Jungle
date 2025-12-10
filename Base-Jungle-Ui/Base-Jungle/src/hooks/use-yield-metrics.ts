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
        
        // Avoid double-counting if same vault
        const isSameVault = conservativeVaultAddress?.toLowerCase() === aggressiveVaultAddress?.toLowerCase();
        const totalBalance = isSameVault 
            ? conservativeVal // Only count once
            : conservativeVal + aggressiveVal;

        // For SimpleTestVault: No real yield generation yet
        // Show principal as total balance, yield as 0
        const principal = totalBalance;
        const totalYield = 0;
        const harvestableYield = 0;

        return {
            principal,
            totalYield,
            harvestableYield,
            dailyPnL: 0, // No yield = no daily change
            isLoading: loadingConservative || loadingAggressive,
        };
    }, [conservativeBal, aggressiveBal, loadingConservative, loadingAggressive, conservativeVaultAddress, aggressiveVaultAddress]);
}
