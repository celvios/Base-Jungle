import { ethers } from 'ethers';
import axios from 'axios';

/**
 * Gas price utilities for keeper bots
 */

export interface GasPrice {
    slow: bigint;
    standard: bigint;
    fast: bigint;
    timestamp: number;
}

/**
 * Get current Base network gas prices
 */
export async function getCurrentGasPrice(): Promise<GasPrice> {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
        const feeData = await provider.getFeeData();

        const gasPrice = feeData.gasPrice || BigInt(0);

        return {
            slow: (gasPrice * BigInt(90)) / BigInt(100),      // 90% of current
            standard: gasPrice,                                 // Current
            fast: (gasPrice * BigInt(120)) / BigInt(100),      // 120% of current
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error fetching gas price:', error);
        // Fallback to reasonable defaults (2 gwei)
        return {
            slow: ethers.parseUnits('1.5', 'gwei'),
            standard: ethers.parseUnits('2', 'gwei'),
            fast: ethers.parseUnits('3', 'gwei'),
            timestamp: Date.now()
        };
    }
}

/**
 * Check if current gas price is acceptable for keeper operations
 * @param maxGwei Maximum acceptable gas price in gwei
 */
export async function isGasPriceAcceptable(maxGwei: number = 50): Promise<boolean> {
    const gasPrice = await getCurrentGasPrice();
    const maxPrice = ethers.parseUnits(maxGwei.toString(), 'gwei');

    return gasPrice.standard <= maxPrice;
}

/**
 * Estimate gas cost in USD
 * @param gasUnits Estimated gas units for transaction
 * @param ethPriceUSD Current ETH price in USD
 */
export async function estimateGasCostUSD(
    gasUnits: number,
    ethPriceUSD: number
): Promise<number> {
    const gasPrice = await getCurrentGasPrice();
    const gasCostWei = BigInt(gasUnits) * gasPrice.standard;
    const gasCostETH = Number(ethers.formatEther(gasCostWei));

    return gasCostETH * ethPriceUSD;
}

/**
 * Get current ETH price from CoinGecko
 */
export async function getETHPrice(): Promise<number> {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        return response.data.ethereum.usd;
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        return 2000; // Fallback default
    }
}

/**
 * Wait for gas price to drop below threshold
 * @param maxGwei Maximum acceptable gas price
 * @param timeoutMs Maximum time to wait in milliseconds
 */
export async function waitForAcceptableGasPrice(
    maxGwei: number = 50,
    timeoutMs: number = 300000 // 5 minutes
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        if (await isGasPriceAcceptable(maxGwei)) {
            return true;
        }

        // Wait 30 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 30000));
    }

    return false;
}
