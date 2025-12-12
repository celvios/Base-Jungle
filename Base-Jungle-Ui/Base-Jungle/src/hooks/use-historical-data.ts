import { useState, useEffect, useCallback, useMemo } from 'react';
import { useYieldMetrics } from './use-yield-metrics';
import { type Address } from 'viem';

interface HistoricalDataPoint {
    time: string;
    value: number;
}

interface HistoricalData {
    chartData: HistoricalDataPoint[];
    dailyPnL: number;
    isLoading: boolean;
}

const MAX_DATA_POINTS = 24; // Keep last 24 data points
const POLL_INTERVAL = 30000; // Poll every 30 seconds

export function useHistoricalData(
    conservativeVaultAddress: Address,
    aggressiveVaultAddress: Address,
    userAddress: Address | undefined
): HistoricalData {
    const [dataPoints, setDataPoints] = useState<Array<{ time: string; value: number; timestamp: number }>>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Get current yield metrics
    const {
        principal,
        totalYield,
        isLoading: isLoadingMetrics
    } = useYieldMetrics(conservativeVaultAddress, aggressiveVaultAddress, userAddress);

    // Calculate total value (principal + yield)
    const totalValue = principal + totalYield;

    // Add new data point
    const addDataPoint = useCallback(() => {
        if (!userAddress || totalValue === 0) return;

        const now = Date.now();
        const timeStr = new Date(now).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        setDataPoints(prev => {
            const newPoint = {
                time: timeStr,
                value: totalValue,
                timestamp: now
            };

            // Add new point and keep only last MAX_DATA_POINTS
            const updated = [...prev, newPoint].slice(-MAX_DATA_POINTS);
            return updated;
        });
    }, [userAddress, totalValue]);

    // Initialize with historical simulation on first load
    useEffect(() => {
        if (!isInitialized && totalValue > 0 && !isLoadingMetrics) {
            // Generate simulated historical data (last 2 hours)
            const now = Date.now();
            const historicalPoints: Array<{ time: string; value: number; timestamp: number }> = [];

            // Start from 2 hours ago
            const startTime = now - (2 * 60 * 60 * 1000);
            const interval = (2 * 60 * 60 * 1000) / MAX_DATA_POINTS;

            // Simulate gradual growth from slightly lower value
            const startValue = totalValue * 0.995; // Start 0.5% lower
            const growthPerPoint = (totalValue - startValue) / MAX_DATA_POINTS;

            for (let i = 0; i < MAX_DATA_POINTS; i++) {
                const timestamp = startTime + (i * interval);
                const value = startValue + (growthPerPoint * i);

                historicalPoints.push({
                    time: new Date(timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }),
                    value: value,
                    timestamp: timestamp
                });
            }

            setDataPoints(historicalPoints);
            setIsInitialized(true);
        }
    }, [isInitialized, totalValue, isLoadingMetrics]);

    // Poll for updates
    useEffect(() => {
        if (!isInitialized || !userAddress) return;

        // Add initial point
        addDataPoint();

        // Set up polling
        const intervalId = setInterval(() => {
            addDataPoint();
        }, POLL_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isInitialized, userAddress, addDataPoint]);

    // Calculate daily PnL from data points
    const dailyPnL = useMemo(() => {
        if (dataPoints.length < 2) return 0;
        const first = dataPoints[0].value;
        const last = dataPoints[dataPoints.length - 1].value;
        return first > 0 ? ((last - first) / first) * 100 : 0;
    }, [dataPoints]);

    // Format data for chart
    const chartData = useMemo(() => {
        return dataPoints.map(({ time, value }) => ({ time, value }));
    }, [dataPoints]);

    return {
        chartData,
        dailyPnL: Number(dailyPnL.toFixed(2)),
        isLoading: isLoadingMetrics || !isInitialized
    };
}
