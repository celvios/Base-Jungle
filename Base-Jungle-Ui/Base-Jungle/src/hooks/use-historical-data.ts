import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface HistoricalDataPoint {
    time: string;
    value: number;
}

interface HistoricalData {
    chartData: HistoricalDataPoint[];
    dailyPnL: number;
    isLoading: boolean;
}

export function useHistoricalData(
    conservativeVaultAddress: Address,
    aggressiveVaultAddress: Address,
    userAddress: Address | undefined
): HistoricalData {
    const { data, isLoading } = useQuery({
        queryKey: ['balanceHistory', userAddress],
        queryFn: async () => {
            if (!userAddress) return null;

            const response = await fetch(
                `${API_URL}/user/${userAddress}/balance-history?period=24h`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch balance history');
            }

            return response.json() as Promise<Array<{ time: number; value: number }>>;
        },
        enabled: !!userAddress,
        staleTime: 60000, // 1 minute
    });

    return useMemo(() => {
        if (!data || data.length === 0) {
            // Return empty chart if no data
            return {
                chartData: [],
                dailyPnL: 0,
                isLoading,
            };
        }

        // Format data for chart (convert timestamp to time string)
        const chartData = data.map(point => ({
            time: new Date(point.time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            value: point.value,
        }));

        // Calculate 24h PnL
        const firstValue = data[0]?.value || 0;
        const lastValue = data[data.length - 1]?.value || 0;
        const dailyPnL = firstValue > 0
            ? ((lastValue - firstValue) / firstValue) * 100
            : 0;

        return {
            chartData,
            dailyPnL: Number(dailyPnL.toFixed(2)),
            isLoading,
        };
    }, [data, isLoading]);
}
