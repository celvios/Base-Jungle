import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { type Address, formatUnits } from 'viem';

interface ActivityEvent {
    id: string;
    type: 'deposit' | 'withdraw' | 'allocate' | 'deallocate' | 'harvest' | 'rebalance';
    amount: string;
    strategy?: string;
    timestamp: Date;
    txHash: string;
}

const VAULT_EVENTS_ABI = [
    {
        type: 'event',
        name: 'Deposited',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'assets', type: 'uint256', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
            { name: 'fee', type: 'uint256', indexed: false }
        ]
    },
    {
        type: 'event',
        name: 'Withdrawn',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'assets', type: 'uint256', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
            { name: 'fee', type: 'uint256', indexed: false }
        ]
    },
    {
        type: 'event',
        name: 'Harvested',
        inputs: [
            { name: 'yield', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    }
] as const;

const CONTROLLER_EVENTS_ABI = [
    {
        type: 'event',
        name: 'Allocated',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'strategyId', type: 'uint256', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
        ]
    },
    {
        type: 'event',
        name: 'Deallocated',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'strategyId', type: 'uint256', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
        ]
    },
    {
        type: 'event',
        name: 'Rebalanced',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    }
] as const;

const STRATEGY_NAMES: Record<number, string> = {
    0: 'Moonwell',
    1: 'Leveraged Lending',
    2: 'Stable LP',
    3: 'Volatile LP',
    4: 'Beefy',
    5: 'Leveraged LP'
};

export function useStrategyActivity(
    vaultAddress: Address,
    controllerAddress: Address | undefined,
    userAddress: Address | undefined
) {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();

    useEffect(() => {
        if (!publicClient || !vaultAddress || !userAddress) return;

        let isSubscribed = true;

        const fetchRecentEvents = async () => {
            try {
                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 1000n; // Last ~1000 blocks

                // Fetch vault events
                const depositLogs = await publicClient.getLogs({
                    address: vaultAddress,
                    event: VAULT_EVENTS_ABI[0],
                    args: { user: userAddress },
                    fromBlock,
                    toBlock: 'latest'
                });

                const withdrawLogs = await publicClient.getLogs({
                    address: vaultAddress,
                    event: VAULT_EVENTS_ABI[1],
                    args: { user: userAddress },
                    fromBlock,
                    toBlock: 'latest'
                });

                const harvestLogs = await publicClient.getLogs({
                    address: vaultAddress,
                    event: VAULT_EVENTS_ABI[2],
                    fromBlock,
                    toBlock: 'latest'
                });

                // Fetch controller events if available
                let allocateLogs: any[] = [];
                let deallocateLogs: any[] = [];
                let rebalanceLogs: any[] = [];

                if (controllerAddress) {
                    allocateLogs = await publicClient.getLogs({
                        address: controllerAddress,
                        event: CONTROLLER_EVENTS_ABI[0],
                        args: { user: vaultAddress }, // Vault is the "user" in controller
                        fromBlock,
                        toBlock: 'latest'
                    });

                    deallocateLogs = await publicClient.getLogs({
                        address: controllerAddress,
                        event: CONTROLLER_EVENTS_ABI[1],
                        args: { user: vaultAddress },
                        fromBlock,
                        toBlock: 'latest'
                    });

                    rebalanceLogs = await publicClient.getLogs({
                        address: controllerAddress,
                        event: CONTROLLER_EVENTS_ABI[2],
                        args: { user: vaultAddress },
                        fromBlock,
                        toBlock: 'latest'
                    });
                }

                if (!isSubscribed) return;

                // Process events
                const events: ActivityEvent[] = [];

                // Process deposits
                depositLogs.forEach(log => {
                    if (log.args.assets) {
                        events.push({
                            id: `${log.transactionHash}-${log.logIndex}`,
                            type: 'deposit',
                            amount: formatUnits(log.args.assets, 6),
                            timestamp: new Date(),
                            txHash: log.transactionHash
                        });
                    }
                });

                // Process withdrawals
                withdrawLogs.forEach(log => {
                    if (log.args.assets) {
                        events.push({
                            id: `${log.transactionHash}-${log.logIndex}`,
                            type: 'withdraw',
                            amount: formatUnits(log.args.assets, 6),
                            timestamp: new Date(),
                            txHash: log.transactionHash
                        });
                    }
                });

                // Process harvests
                harvestLogs.forEach(log => {
                    if (log.args.yield) {
                        events.push({
                            id: `${log.transactionHash}-${log.logIndex}`,
                            type: 'harvest',
                            amount: formatUnits(log.args.yield, 6),
                            timestamp: new Date(),
                            txHash: log.transactionHash
                        });
                    }
                });

                // Process allocations
                allocateLogs.forEach(log => {
                    if (log.args.amount && log.args.strategyId !== undefined) {
                        events.push({
                            id: `${log.transactionHash}-${log.logIndex}`,
                            type: 'allocate',
                            amount: formatUnits(log.args.amount, 6),
                            strategy: STRATEGY_NAMES[Number(log.args.strategyId)] || `Strategy ${log.args.strategyId}`,
                            timestamp: new Date(),
                            txHash: log.transactionHash
                        });
                    }
                });

                // Process deallocations
                deallocateLogs.forEach(log => {
                    if (log.args.amount && log.args.strategyId !== undefined) {
                        events.push({
                            id: `${log.transactionHash}-${log.logIndex}`,
                            type: 'deallocate',
                            amount: formatUnits(log.args.amount, 6),
                            strategy: STRATEGY_NAMES[Number(log.args.strategyId)] || `Strategy ${log.args.strategyId}`,
                            timestamp: new Date(),
                            txHash: log.transactionHash
                        });
                    }
                });

                // Process rebalances
                rebalanceLogs.forEach(log => {
                    events.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        type: 'rebalance',
                        amount: '0',
                        timestamp: new Date(),
                        txHash: log.transactionHash
                    });
                });

                // Sort by most recent
                events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                setActivities(events.slice(0, 20)); // Keep last 20
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching strategy activity:', error);
                setIsLoading(false);
            }
        };

        fetchRecentEvents();

        // Poll for new events every 15 seconds
        const interval = setInterval(fetchRecentEvents, 15000);

        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, [publicClient, vaultAddress, controllerAddress, userAddress]);

    return {
        activities,
        isLoading
    };
}
