import { useMemo } from 'react';
import { useVaultBalance } from './use-vault';
import { useReadContract } from 'wagmi';
import { type Address, formatUnits } from 'viem';

interface YieldMetrics {
    principal: number;
    totalYield: number;
    harvestableYield: number;
    dailyPnL: number;
    isLoading: boolean;
}

const VAULT_ABI = [
    {
        name: 'strategyController',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    }
] as const;

const STRATEGY_CONTROLLER_ABI = [
    {
        name: 'strategies',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'strategyType', type: 'uint8' },
            { name: 'adapter', type: 'address' },
            { name: 'asset', type: 'address' },
            { name: 'isActive', type: 'bool' },
            { name: 'totalAllocated', type: 'uint256' },
            { name: 'targetAPY', type: 'uint256' },
            { name: 'riskScore', type: 'uint256' },
            { name: 'minTier', type: 'uint8' }
        ],
    }
] as const;

const ADAPTER_ABI = [
    {
        name: 'balanceOf',
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
    // Check if both vaults are the same to avoid double-counting
    const isSameVault = conservativeVaultAddress?.toLowerCase() === aggressiveVaultAddress?.toLowerCase();

    // 1. Get Base Balances (user's current value)
    const { data: balC, isLoading: isLoadingBalC } = useVaultBalance(conservativeVaultAddress, userAddress);
    const { data: balA } = useVaultBalance(aggressiveVaultAddress, userAddress);

    // 2. Get Strategy Controller
    const { data: controllerAddress } = useReadContract({
        address: conservativeVaultAddress,
        abi: VAULT_ABI,
        functionName: 'strategyController',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 3. Get Strategy 0 (Moonwell Lending) - 70% allocation
    const { data: strategy0 } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'strategies',
        args: [0n],
        query: { enabled: !!controllerAddress }
    });

    // 4. Get Strategy 4 (Beefy) - 30% allocation
    const { data: strategy4 } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'strategies',
        args: [4n],
        query: { enabled: !!controllerAddress }
    });

    // 5. Get Adapter Balances
    const { data: adapter0Balance, isLoading: isLoading0 } = useReadContract({
        address: strategy0?.[1] as Address, // adapter address
        abi: ADAPTER_ABI,
        functionName: 'balanceOf',
        query: { enabled: !!strategy0?.[1] }
    });

    const { data: adapter4Balance, isLoading: isLoading4 } = useReadContract({
        address: strategy4?.[1] as Address,
        abi: ADAPTER_ABI,
        functionName: 'balanceOf',
        query: { enabled: !!strategy4?.[1] }
    });

    return useMemo(() => {
        // Base Principal from user balance
        const cPrincipal = balC ? Number(formatUnits(balC as bigint, 6)) : 0;
        const aPrincipal = (balA && !isSameVault) ? Number(formatUnits(balA as bigint, 6)) : 0;
        const totalPrincipal = cPrincipal + aPrincipal;

        // Calculate Yield from adapter balances
        let totalYield = 0;

        if (strategy0 && strategy4 && adapter0Balance && adapter4Balance) {
            // Real balances in adapters
            const realBalance0 = Number(formatUnits(adapter0Balance, 6));
            const realBalance4 = Number(formatUnits(adapter4Balance, 6));
            const totalRealBalance = realBalance0 + realBalance4;

            // Allocated amounts (principal)
            const allocated0 = Number(formatUnits(strategy0[4], 6)); // totalAllocated
            const allocated4 = Number(formatUnits(strategy4[4], 6));
            const totalAllocated = allocated0 + allocated4;

            // Total vault profit
            const vaultProfit = totalRealBalance - totalAllocated;

            // User's share of profit (proportional to their principal)
            if (totalPrincipal > 0 && totalAllocated > 0) {
                const userFraction = totalPrincipal / totalAllocated;
                totalYield = vaultProfit * userFraction;
            }
        }

        return {
            principal: totalPrincipal,
            totalYield: totalYield,
            harvestableYield: totalYield,
            dailyPnL: totalPrincipal > 0 ? (totalYield / totalPrincipal) * 100 : 0,
            isLoading: isLoadingBalC || isLoading0 || isLoading4
        };
    }, [balC, balA, strategy0, strategy4, adapter0Balance, adapter4Balance, isLoadingBalC, isLoading0, isLoading4, isSameVault]);
}
