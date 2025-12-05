import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 1. Get projectId from environment variable
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
    throw new Error('VITE_REOWN_PROJECT_ID is not set in environment variables');
}

// 2. Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
    networks: [baseSepolia],
    projectId,
    ssr: false,
});

// 3. Create modal with proper mobile wallet detection
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: [baseSepolia],
    projectId,
    metadata: {
        name: 'Base Jungle',
        description: 'DeFi Yield Optimization Protocol on Base',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://base-jungle.vercel.app',
        icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://base-jungle.vercel.app'}/favicon.png`],
    },
    // CRITICAL: Featured wallets shown first on mobile
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    ],
    // Include recommended wallets
    includeWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
    ],
    features: {
        analytics: true,
        email: true,
        socials: ['google', 'x', 'discord', 'farcaster'],
        onramp: true,
        swaps: true,
    },
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#10b981',
    },
    // Show all wallets option
    allWallets: 'SHOW',
});

export const queryClient = new QueryClient();

export const config = wagmiAdapter.wagmiConfig;

declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}
