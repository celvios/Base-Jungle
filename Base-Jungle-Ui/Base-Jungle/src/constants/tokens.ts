import type { Address } from 'viem';

/**
 * Token configuration for Base Jungle
 * Currently using Mock USDC for testing until mainnet deployment
 */

// Mock USDC address (Base Sepolia)
// This is the deployed MockERC20 contract address
export const MOCK_USDC_ADDRESS: Address = 
  (import.meta.env.VITE_USDC_ADDRESS as Address) || 
  '0x634c1cf5129fC7bd49736b9684375E112e4000E1'; // Deployed mock USDC

// Mainnet USDC address (for future use)
export const MAINNET_USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Current USDC address (uses mock for now)
export const USDC_ADDRESS: Address = MOCK_USDC_ADDRESS;

// Token configuration
export const TOKEN_CONFIG = {
  USDC: {
    address: USDC_ADDRESS,
    symbol: 'Mock USDC',
    name: 'Mock USD Coin',
    decimals: 6,
    isMock: true, // Flag to indicate this is a mock token
    network: 'baseSepolia',
  },
} as const;

// Helper to get token display name
export function getTokenDisplayName(symbol: string = 'USDC'): string {
  if (symbol === 'USDC' && TOKEN_CONFIG.USDC.isMock) {
    return 'Mock USDC';
  }
  return symbol;
}

// Helper to get token symbol
export function getTokenSymbol(symbol: string = 'USDC'): string {
  if (symbol === 'USDC' && TOKEN_CONFIG.USDC.isMock) {
    return 'Mock USDC';
  }
  return symbol;
}

