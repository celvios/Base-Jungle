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

// 2. Set up Wagmi adapter with mobile support
export const wagmiAdapter = new WagmiAdapter({
    networks: [baseSepolia],
    projectId,
    ssr: false,
});

// Get wagmi config to add injected connector
export const config = wagmiAdapter.wagmiConfig;

// Define metadata strictly to ensure deep links work on mobile
const metadata = {
    name: 'Base Jungle',
    description: 'DeFi Yield Optimization Protocol on Base',
    url: 'https://base-jungle.vercel.app',
    icons: ['https://base-jungle.vercel.app/favicon.png']
};

// 3. Create modal with debug mode and explicit flags
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: [baseSepolia],
    projectId,
    metadata,
    features: {
        analytics: true,
        email: true,
        socials: ['google', 'x', 'discord', 'farcaster'],
        onramp: true,
        swaps: true,
    },
    // Force enable core connection methods
    enableWalletConnect: true,
    enableInjected: true,
    enableCoinbase: true,
    // Add debug logs
    enableAnalytics: true,
    // Theme configuration
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#10b981',
    },
    // Show ALL wallets without restrictions
    allWallets: 'SHOW',
});

export const queryClient = new QueryClient();

declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}
