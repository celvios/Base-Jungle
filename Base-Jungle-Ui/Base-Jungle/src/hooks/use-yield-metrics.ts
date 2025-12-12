import { useMemo } from 'react';
import { useVaultBalance, useVaultShareBalance } from './use-vault';
import { useReadContract } from 'wagmi';
import { type Address, formatUnits } from 'viem';

interface YieldMetrics {
    principal: number;
    totalYield: number;
    harvestableYield: number;
    dailyPnL: number;
    isLoading: boolean;
}

const STRATEGY_CONTROLLER_ABI = [
    {
        name: 'getTotalValue',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'strategyController',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    }
] as const;

const TOTAL_SUPPLY_ABI = [
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    }
] as const;

export function useYieldMetrics(
    conservativeVaultAddress: Address,
    aggressiveVaultAddress: Address,
    userAddress: Address | undefined
): YieldMetrics {
    // 1. Get Base Balances (Verified working in header)
    const { data: balC, isLoading: isLoadingBalC } = useVaultBalance(conservativeVaultAddress, userAddress);
    const { data: balA } = useVaultBalance(aggressiveVaultAddress, userAddress);

    // 2. Get User Shares (for yield calc)
    const { data: sharesC } = useVaultShareBalance(conservativeVaultAddress, userAddress);

    // 3. Get Vault Total Supply
    const { data: totalSupplyC } = useReadContract({
        address: conservativeVaultAddress,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 4. Get Strategy Controller & Real Value
    const { data: controllerAddress } = useReadContract({
        address: conservativeVaultAddress,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'strategyController',
        query: { enabled: !!conservativeVaultAddress }
    });

    const { data: totalValueC, isLoading: isLoadingCtrl } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'getTotalValue',
        args: [conservativeVaultAddress],
        query: { enabled: !!controllerAddress && !!conservativeVaultAddress }
    });

    return useMemo(() => {
        // Base Principal from Verified Balance Hook
        let cPrincipal = balC ? Number(formatUnits(balC as bigint, 6)) : 0;
        let cYield = 0;

        // Try calculate Real Yield if data available
        if (sharesC && totalSupplyC && totalValueC && totalSupplyC > 0n) {
            const userShares = Number(formatUnits(sharesC, 18));
            const totalShares = Number(formatUnits(totalSupplyC, 18));
            const realVaultValue = Number(formatUnits(totalValueC, 6)); // USDC

            if (totalShares > 0) {
                const fraction = userShares / totalShares;
                const realUserValue = fraction * realVaultValue;

                // Yield = RealValue - BookValue (Principal)
                // If real value > principal, we have profit
                if (realUserValue > cPrincipal) {
                    cYield = realUserValue - cPrincipal;
                }
            }
        }

        const aPrincipal = balA ? Number(formatUnits(balA as bigint, 6)) : 0;
        const totalPrincipal = cPrincipal + aPrincipal;
        const totalYield = cYield;

        return {
            principal: totalPrincipal,
            totalYield: totalYield,
            harvestableYield: totalYield,
            dailyPnL: totalPrincipal > 0 ? (totalYield / totalPrincipal) * 100 : 0,
            isLoading: isLoadingBalC || isLoadingCtrl
        };
    }, [balC, balA, sharesC, totalSupplyC, totalValueC, isLoadingBalC, isLoadingCtrl]);
}
