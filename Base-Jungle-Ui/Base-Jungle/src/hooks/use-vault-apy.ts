import { useReadContract } from 'wagmi';
import { type Address } from 'viem';

const VAULT_ABI = [
    {
        inputs: [],
        name: 'totalAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Hook to get estimated APY for a vault
 * 
 * NOTE: True APY calculation requires historical harvest data.
 * For now, returns realistic estimates based on vault type.
 * 
 * TODO: Implement real APY calculation from:
 * - Recent harvest events
 * - Total assets vs total yield over time
 * - Annualized return percentage
 */
export function useVaultAPY(vaultAddress: Address | undefined) {
    // Get vault total assets (for future calculation)
    const { data: totalAssets } = useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'totalAssets',
        query: {
            enabled: !!vaultAddress,
        },
    });

    // Realistic APY estimates based on vault type and market conditions
    // These are conservative estimates for stablecoin yield strategies
    const getEstimatedAPY = (address: string): number => {
        const addrLower = address.toLowerCase();

        // Check which vault based on address
        const conservativeAddr = import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS?.toLowerCase();
        const aggressiveAddr = import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS?.toLowerCase();

        if (addrLower === conservativeAddr) {
            // Conservative: Stablecoin lending (Aave, Compound, etc.)
            // Typical range: 3-8% in current market
            return 5.5; // Mid-range estimate
        }

        if (addrLower === aggressiveAddr) {
            // Aggressive: LP + leveraged strategies
            // Typical range: 8-15% base, up to 25% with leverage
            return 12.0; // Conservative estimate for base strategy
        }

        // Default conservative estimate
        return 6.0;
    };

    const estimatedAPY = vaultAddress ? getEstimatedAPY(vaultAddress) : 0;

    return {
        apy: estimatedAPY,
        isEstimate: true, // Flag indicating this is an estimate, not calculated
        totalAssets, // For future use in real calculation
    };
}

/**
 * Get APY with leverage multiplier applied
 */
export function useLeveragedAPY(
    vaultAddress: Address | undefined,
    leverageMultiplier: number = 1
) {
    const { apy, isEstimate } = useVaultAPY(vaultAddress);

    // Leverage increases returns but also risk
    // Simplified: Each 1x leverage adds ~3-4% to base APY
    const leverageBoost = leverageMultiplier > 1 ? (leverageMultiplier - 1) * 3.5 : 0;
    const leveragedAPY = apy + leverageBoost;

    return {
        apy: Number(leveragedAPY.toFixed(2)),
        baseAPY: Number(apy.toFixed(2)),
        leverageBoost: Number(leverageBoost.toFixed(2)),
        isEstimate,
    };
}

/**
 * Get APY for risk level (maps to vault selection)
 */
export function useRiskLevelAPY(riskLevel: 'low' | 'medium' | 'high') {
    const conservativeVault = import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
    const aggressiveVault = import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address;

    // Map risk levels to vaults
    const vaultAddress = (() => {
        if (riskLevel === 'low') return conservativeVault;
        if (riskLevel === 'high') return aggressiveVault;
        return aggressiveVault; // medium defaults to aggressive
    })();

    return useVaultAPY(vaultAddress);
}
