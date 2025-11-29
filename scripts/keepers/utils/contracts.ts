import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Contract instance utilities
 */

// Contract ABIs (simplified - add full ABIs as needed)
const GAUGE_ADAPTER_ABI = [
    'function getPendingRewards(address gauge, address user) external view returns (uint256)',
    'function compound(address gauge) external returns (uint256)',
    'function stakedBalance(address gauge, address user) external view returns (uint256)'
];

const ERC20_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)'
];

/**
 * Get ethers provider for Base network
 */
export function getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get keeper wallet
 */
export function getKeeperWallet(): ethers.Wallet {
    const privateKey = process.env.KEEPER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('KEEPER_PRIVATE_KEY not set in environment');
    }

    const provider = getProvider();
    return new ethers.Wallet(privateKey, provider);
}

/**
 * Get AerodromeGaugeAdapter contract instance
 */
export function getGaugeAdapterContract(address: string): ethers.Contract {
    const wallet = getKeeperWallet();
    return new ethers.Contract(address, GAUGE_ADAPTER_ABI, wallet);
}

/**
 * Get ERC20 token contract instance
 */
export function getTokenContract(address: string): ethers.Contract {
    const provider = getProvider();
    return new ethers.Contract(address, ERC20_ABI, provider);
}

/**
 * Wait for transaction confirmation with retries
 */
export async function waitForTransaction(
    tx: ethers.TransactionResponse,
    confirmations: number = 2
): Promise<ethers.TransactionReceipt | null> {
    try {
        const receipt = await tx.wait(confirmations);
        return receipt;
    } catch (error) {
        console.error('Transaction failed:', error);
        return null;
    }
}

/**
 * Estimate gas for contract call
 */
export async function estimateGas(
    contract: ethers.Contract,
    method: string,
    args: any[]
): Promise<number> {
    try {
        const gasEstimate = await contract[method].estimateGas(...args);
        // Add 20% buffer
        return Number(gasEstimate * BigInt(120) / BigInt(100));
    } catch (error) {
        console.error(`Gas estimation failed for ${method}:`, error);
        // Return conservative default
        return 150000;
    }
}
