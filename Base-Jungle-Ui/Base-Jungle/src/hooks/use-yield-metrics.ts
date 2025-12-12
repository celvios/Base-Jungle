import { useMemo } from 'react';
import { useVaultBalance, useVaultShareBalance, useVaultTVL } from './use-vault';
import { useReadContract } from 'wagmi';
import { type Address, parseAbiItem } from 'viem';

interface YieldMetrics {
    principal: number;
    totalYield: number;
    harvestableYield: number;
    dailyPnL: number;
    isLoading: boolean;
}

// ABI for StrategyController to get total value (real-time including profit)
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

export function useYieldMetrics(
    conservativeVaultAddress: Address,
    aggressiveVaultAddress: Address,
    userAddress: Address | undefined
): YieldMetrics {
    // 1. Get User Shares
    const { data: sharesC } = useVaultShareBalance(conservativeVaultAddress, userAddress);
    const { data: sharesA } = useVaultShareBalance(aggressiveVaultAddress, userAddress);

    // 2. Get Vault Total Supply (to calc share ownership %)
    const { data: totalSupplyC } = useReadContract({
        address: conservativeVaultAddress,
        abi: parseAbiItem('function totalSupply() view returns (uint256)'),
        functionName: 'totalSupply',
    });

    // 3. Get Strategy Controller Address
    const { data: controllerAddress } = useReadContract({
        address: conservativeVaultAddress,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'strategyController',
    });

    // 4. Get Real Total Value from Strategy Controller (User = Vault)
    const { data: totalValueC, isLoading: isLoadingC } = useReadContract({
        address: controllerAddress as Address,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'getTotalValue',
        args: [conservativeVaultAddress],
        query: { enabled: !!controllerAddress && !!conservativeVaultAddress }
    });

    // We only focus on Conservative Vault for now as per user context, 
    // but logic should ideally cover both if Aggressive was active.
    // Assuming 0 for aggressive for simplicity unless needed.

    return useMemo(() => {
        // Calculate Conservative Vault Yield
        let cPrincipal = 0;
        let cRealValue = 0;
        let cYield = 0;

        if (sharesC && totalSupplyC && totalValueC) {
            const sharesNum = Number(sharesC);
            const supplyNum = Number(totalSupplyC);
            const valueNum = Number(totalValueC); // 1e6

            if (supplyNum > 0) {
                // User ownership fraction
                const fraction = sharesNum / supplyNum;

                // User's share of REAL value (from strategy controller)
                const realUserValue = fraction * valueNum;
                cRealValue = realUserValue / 1e6; // Convert to USDC

                // Estimate principal based on 1:1 initial peg (approx)
                // Or use deposit amount if we had it. 
                // Fallback: Principal = Shares (normalized to 1e6) if we assume 1 share = 1 USDC initially
                // Note: Shares are 1e18, USDC is 1e6. So divide shares by 1e12 to get "Principal USDC"
                const principalEst = sharesNum / 1e12 / 1e6;
                cPrincipal = principalEst;

                cYield = cRealValue - cPrincipal;
            }
        } else if (sharesC) {
            // Fallback if controller read fails: assume logic from before
            cPrincipal = Number(sharesC) / 1e18; // Approx
            cRealValue = cPrincipal;
        }

        // --- Aggressive (Simplified/Placeholder) ---
        const aPrincipal = sharesA ? Number(sharesA) / 1e18 : 0;

        const totalPrincipal = cPrincipal + aPrincipal;
        const totalYield = cYield; // + aYield if implemented

        return {
            principal: totalPrincipal,
            totalYield: totalYield,
            harvestableYield: totalYield, // Unrealized is harvestable
            dailyPnL: totalPrincipal > 0 ? (totalYield / totalPrincipal) * 100 : 0,
            isLoading: isLoadingC
        };
    }, [sharesC, sharesA, totalSupplyC, totalValueC, isLoadingC]);
}
