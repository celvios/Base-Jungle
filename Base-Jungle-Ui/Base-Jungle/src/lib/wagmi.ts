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

// 3. Create modal with proper mobile support
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
    features: {
        analytics: true,
        email: true,
        socials: ['google', 'x', 'discord', 'farcaster'],
        onramp: true,
        swaps: true,
    },
    // Theme configuration
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#10b981',
    },
    // CRITICAL: Enable all wallets for mobile
    allWallets: 'SHOW',
});

export const queryClient = new QueryClient();

export const config = wagmiAdapter.wagmiConfig;

declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}
