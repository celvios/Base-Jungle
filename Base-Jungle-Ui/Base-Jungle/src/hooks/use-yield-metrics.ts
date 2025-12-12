import { useMemo } from 'react';
import { useVaultShareBalance } from './use-vault';
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
    // 1. Get User Shares
    const { data: sharesC } = useVaultShareBalance(conservativeVaultAddress, userAddress);
    const { data: sharesA } = useVaultShareBalance(aggressiveVaultAddress, userAddress);

    // 2. Get Vault Total Supply
    const { data: totalSupplyC } = useReadContract({
        address: conservativeVaultAddress,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 3. Get Strategy Controller Address
    const { data: controllerAddress } = useReadContract({
        address: conservativeVaultAddress,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'strategyController',
        query: { enabled: !!conservativeVaultAddress }
    });

    // 4. Get Real Total Value from Strategy Controller
    const { data: totalValueC, isLoading: isLoadingC } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'getTotalValue',
        args: [conservativeVaultAddress],
        query: { enabled: !!controllerAddress && !!conservativeVaultAddress }
    });

    return useMemo(() => {
        let cPrincipal = 0;
        let cRealValue = 0;
        let cYield = 0;

        // Helper to format shares (18 decimals)
        const formatShares = (v: bigint) => Number(formatUnits(v, 18));
        // Helper to format values (6 decimals for USDC)
        const formatValue = (v: bigint) => Number(formatUnits(v, 6));

        // Logic for Conservative Vault
        if (sharesC && totalSupplyC && totalValueC && totalSupplyC > 0n) {
            const userShares = formatShares(sharesC);
            const totalShares = formatShares(totalSupplyC);
            const vaultParams = formatValue(totalValueC);

            // User Fraction
            const fraction = userShares / totalShares;

            // Real Value
            cRealValue = fraction * vaultParams;

            // Principal Estimate (assuming 1 Share = 1 USDC initially)
            // Shares are 1e18, but prices are 1e6 usually. 
            // Logic: 1 share = 1 * 10^18 units.
            // 1 USDC = 1 * 10^6 units.
            // If 1 Share was minted for 1 USDC:
            // userShares (normalized to 1.0) * 1.0 = Principal in USDC.
            cPrincipal = userShares;

            cYield = cRealValue - cPrincipal;

        } else if (sharesC) {
            // Fallback: Just show shares as principal 
            cPrincipal = formatShares(sharesC);
            cRealValue = cPrincipal;
        }

        // Logic for Aggressive Vault (Placeholder)
        const aPrincipal = sharesA ? formatShares(sharesA) : 0;

        const totalPrincipal = cPrincipal + aPrincipal;
        const totalYield = cYield;

        return {
            principal: totalPrincipal,
            totalYield: totalYield,
            harvestableYield: totalYield,
            dailyPnL: totalPrincipal > 0 ? (totalYield / totalPrincipal) * 100 : 0,
            isLoading: isLoadingC
        };
    }, [sharesC, sharesA, totalSupplyC, totalValueC, isLoadingC]);
}
