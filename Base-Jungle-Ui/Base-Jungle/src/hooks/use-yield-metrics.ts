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

const VAULT_ABI = [
    {
        name: 'totalAssets',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
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

const STRATEGY_CONTROLLER_ABI = [
    {
        name: 'getTotalAllocated',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
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
    },
    {
        name: 'strategyCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
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

    // 1. Get Base Balances (user's share value at current price)
    const { data: balC, isLoading: isLoadingBalC } = useVaultBalance(conservativeVaultAddress, userAddress);
    const { data: balA } = useVaultBalance(aggressiveVaultAddress, userAddress);

    // 2. Get Vault Total Assets (book value)
    const { data: vaultTotalAssets } = useReadContract({
        address: conservativeVaultAddress,
        abi: VAULT_ABI,
        functionName: 'totalAssets',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 3. Get Strategy Controller
    const { data: controllerAddress } = useReadContract({
        address: conservativeVaultAddress,
        abi: VAULT_ABI,
        functionName: 'strategyController',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 4. Get Total Allocated from Controller
    const { data: totalAllocated, isLoading: isLoadingAlloc } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'getTotalAllocated',
        query: { enabled: !!controllerAddress }
    });

    return useMemo(() => {
        // Base Principal from Verified Balance Hook
        const cPrincipal = balC ? Number(formatUnits(balC as bigint, 6)) : 0;
        const aPrincipal = (balA && !isSameVault) ? Number(formatUnits(balA as bigint, 6)) : 0;
        const totalPrincipal = cPrincipal + aPrincipal;

        // Calculate Yield
        // The vault's totalAssets shows book value (allocated)
        // Our script showed real adapter balances are higher
        // Yield = (VaultTotalAssets + LocalBalance) - TotalAllocated
        // This captures the profit sitting in adapters
        let totalYield = 0;

        if (vaultTotalAssets && totalAllocated) {
            const vaultAssets = Number(formatUnits(vaultTotalAssets, 6));
            const allocated = Number(formatUnits(totalAllocated, 6));

            // If vault has more assets than allocated, that's the profit
            const vaultProfit = vaultAssets - allocated;

            // User's share of profit (proportional to their principal)
            if (totalPrincipal > 0 && vaultAssets > 0) {
                const userFraction = totalPrincipal / vaultAssets;
                totalYield = vaultProfit * userFraction;
            }
        }

        return {
            principal: totalPrincipal,
            totalYield: totalYield,
            harvestableYield: totalYield,
            dailyPnL: totalPrincipal > 0 ? (totalYield / totalPrincipal) * 100 : 0,
            isLoading: isLoadingBalC || isLoadingAlloc
        };
    }, [balC, balA, vaultTotalAssets, totalAllocated, isLoadingBalC, isLoadingAlloc, isSameVault]);
}
