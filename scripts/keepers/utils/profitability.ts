import axios from 'axios';
import { ethers } from 'ethers';

/**
 * Profitability calculations for keeper operations
 */

export interface ProfitabilityCheck {
    isProfitable: boolean;
    rewardValueUSD: number;
    gasCostUSD: number;
    netProfitUSD: number;
    roi: number; // Return on Investment (profit / gas cost)
}

/**
 * Get AERO token price from CoinGecko
 */
export async function getAEROPrice(): Promise<number> {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=aerodrome-finance&vs_currencies=usd'
        );
        return response.data['aerodrome-finance'].usd;
    } catch (error) {
        console.error('Error fetching AERO price:', error);
        return 0.5; // Fallback default
    }
}

/**
 * Get token price from CoinGecko
 * @param tokenId CoinGecko token ID
 */
export async function getTokenPrice(tokenId: string): Promise<number> {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
        );
        return response.data[tokenId].usd;
    } catch (error) {
        console.error(`Error fetching ${tokenId} price:`, error);
        return 0;
    }
}

/**
 * Check if harvest operation is profitable
 * @param rewardAmount Amount of reward tokens (in wei)
 * @param rewardPriceUSD Price of reward token in USD
 * @param estimatedGas Estimated gas units for harvest
 * @param gasPriceWei Current gas price in wei
 * @param ethPriceUSD Current ETH price in USD
 * @param profitabilityThreshold Minimum ROI threshold (default 1.5x = 50% profit)
 */
export function checkProfitability(
    rewardAmount: bigint,
    rewardPriceUSD: number,
    estimatedGas: number,
    gasPriceWei: bigint,
    ethPriceUSD: number,
    profitabilityThreshold: number = 1.5
): ProfitabilityCheck {
    // Calculate reward value in USD
    const rewardETH = Number(ethers.formatEther(rewardAmount));
    const rewardValueUSD = rewardETH * rewardPriceUSD;

    // Calculate gas cost in USD
    const gasCostWei = BigInt(estimatedGas) * gasPriceWei;
    const gasCostETH = Number(ethers.formatEther(gasCostWei));
    const gasCostUSD = gasCostETH * ethPriceUSD;

    // Calculate net profit and ROI
    const netProfitUSD = rewardValueUSD - gasCostUSD;
    const roi = gasCostUSD > 0 ? rewardValueUSD / gasCostUSD : 0;

    const isProfitable = roi >= profitabilityThreshold && netProfitUSD > 0;

    return {
        isProfitable,
        rewardValueUSD,
        gasCostUSD,
        netProfitUSD,
        roi
    };
}

/**
 * Calculate batch profitability for multiple harvests
 */
export function checkBatchProfitability(
    harvests: Array<{
        rewardAmount: bigint;
        rewardPriceUSD: number;
    }>,
    totalEstimatedGas: number,
    gasPriceWei: bigint,
    ethPriceUSD: number
): ProfitabilityCheck {
    // Sum all rewards
    const totalRewardValueUSD = harvests.reduce((sum, harvest) => {
        const rewardETH = Number(ethers.formatEther(harvest.rewardAmount));
        return sum + (rewardETH * harvest.rewardPriceUSD);
    }, 0);

    // Calculate total gas cost
    const gasCostWei = BigInt(totalEstimatedGas) * gasPriceWei;
    const gasCostETH = Number(ethers.formatEther(gasCostWei));
    const gasCostUSD = gasCostETH * ethPriceUSD;

    const netProfitUSD = totalRewardValueUSD - gasCostUSD;
    const roi = gasCostUSD > 0 ? totalRewardValueUSD / gasCostUSD : 0;

    return {
        isProfitable: roi >= 1.5 && netProfitUSD > 0,
        rewardValueUSD: totalRewardValueUSD,
        gasCostUSD,
        netProfitUSD,
        roi
    };
}

/**
 * Format profitability check for logging
 */
export function formatProfitabilityReport(check: ProfitabilityCheck): string {
    return `
Profitability Check:
  Reward Value: $${check.rewardValueUSD.toFixed(2)}
  Gas Cost:     $${check.gasCostUSD.toFixed(2)}
  Net Profit:   $${check.netProfitUSD.toFixed(2)}
  ROI:          ${check.roi.toFixed(2)}x
  Profitable:   ${check.isProfitable ? '✅ YES' : '❌ NO'}
  `;
}
