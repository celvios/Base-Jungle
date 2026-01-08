import { useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useState, useEffect } from 'react';

// Mock Strategy ABI for getPendingYield
const MOCK_STRATEGY_ABI = [
    {
        name: 'getPendingYield',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'totalDeposited',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }]
    }
] as const;

/**
 * Hook to read pending yield from a strategy contract
 */
export function usePendingYield(strategyAddress: Address | undefined) {
    const { data: pendingYield, refetch } = useReadContract({
        address: strategyAddress,
        abi: MOCK_STRATEGY_ABI,
        functionName: 'getPendingYield',
        query: {
            enabled: !!strategyAddress,
            refetchInterval: 60000, // Refresh every 60 seconds
        }
    });

    return {
        pendingYield: pendingYield || 0n,
        refetch
    };
}

/**
 * Hook to aggregate pending yield from multiple strategies
 */
export function useAggregatePendingYield(strategyAddresses: Address[]) {
    const [totalPending, setTotalPending] = useState(0n);

    // Read from each strategy
    const results = strategyAddresses.map(addr =>
        usePendingYield(addr)
    );

    useEffect(() => {
        const total = results.reduce((sum, result) =>
            sum + (result.pendingYield || 0n), 0n
        );
        setTotalPending(total);
    }, [results]);

    return {
        totalPendingYield: totalPending,
        refetchAll: () => results.forEach(r => r.refetch())
    };
}

/**
 * Hook for user's total pending yield across all their deposits
 */
export function useUserPendingYield(userAddress: Address | undefined) {
    // For now, hardcode strategy addresses from deployment
    // TODO: Read from StrategyController to get active strategies
    const STRATEGY_ADDRESSES: Address[] = [
        '0x210BbB9F5C29eB14F9eE621D2D3e121DBDE22705' as Address, // Moonwell from deployed-addresses
    ];

    const { totalPendingYield, refetchAll } = useAggregatePendingYield(STRATEGY_ADDRESSES);

    return {
        pendingYield: totalPendingYield,
        pendingYieldUSDC: Number(totalPendingYield) / 1e6, // Convert to USDC
        refresh: refetchAll
    };
}
