import { useMemo } from 'react';
import { useLeverageManager } from './use-leverage';
import { type Address } from 'viem';

interface LeverageMetrics {
    healthFactor: number;
    liquidationPrice: number;
    maxLeverage: number;
    currentLeverage: number;
    isLoading: boolean;
}

export function useLeverageMetrics(userAddress: Address | undefined): LeverageMetrics {
    const { currentMultiplier, maxMultiplier, isLoading } = useLeverageManager(userAddress);

    return useMemo(() => {
        const leverage = currentMultiplier || 1.0;

        // TODO: Fetch real Health Factor from Strategy/Lending Protocol (e.g., Aave/Moonwell)
        // Simulation: Health Factor decreases as leverage increases
        // Base HF at 1x = 2.5, at 5x = 1.1
        const simulatedHealthFactor = leverage === 1 ? 2.5 : Math.max(1.05, 2.5 - (leverage * 0.3));

        // TODO: Fetch real Entry Price from Strategy
        // Simulation: Liquidation Price gets closer to current price as leverage increases
        // Assume current price is $3000 (ETH/USDC)
        const currentPrice = 3000;
        const liquidationThreshold = 0.85; // 85% LTV

        // Formula: LiqPrice = EntryPrice * (1 - (1/Leverage) + MaintenanceMargin)
        // Simplified for display:
        const simulatedLiquidationPrice = leverage === 1 ? 0 : currentPrice * (1 - (1 / leverage) * liquidationThreshold);

        return {
            healthFactor: Number(simulatedHealthFactor.toFixed(2)),
            liquidationPrice: Math.round(simulatedLiquidationPrice),
            maxLeverage: maxMultiplier || 5,
            currentLeverage: leverage,
            isLoading,
        };
    }, [currentMultiplier, maxMultiplier, isLoading]);
}
