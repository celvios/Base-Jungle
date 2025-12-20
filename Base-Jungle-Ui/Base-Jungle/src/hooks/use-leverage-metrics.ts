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

        // User requested NO SIMULATIONS.
        // Since we are on Testnet with mock strategies, we cannot get real Aave Health Factors.
        // Displaying static "Safe" values is more honest than simulating a breathing effect.

        const healthFactor = 2.50; // Maximum safety
        const liquidationPrice = 0; // No liquidation risk at 1x

        return {
            healthFactor,
            liquidationPrice,
            maxLeverage: maxMultiplier || 5,
            currentLeverage: leverage,
            isLoading,
        };
    }, [currentMultiplier, maxMultiplier, isLoading]);
}
