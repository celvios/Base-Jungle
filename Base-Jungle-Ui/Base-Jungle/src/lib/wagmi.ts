import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Optional: WalletConnect as fallback (can be removed entirely)
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
    chains: [baseSepolia],
    connectors: [
        // Primary: MetaMask via injected connector
        injected({
            target: 'metaMask',
        }),
        // Optional fallback: WalletConnect for other wallets
        // Remove this if you want MetaMask-only
        walletConnect({
            projectId,
            metadata: {
                name: 'Base Jungle',
                description: 'DeFi Yield Optimization Protocol on Base',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://base-jungle.vercel.app',
                icons: ['https://base-jungle.vercel.app/favicon.png'],
            },
            showQrModal: true,
        }),
    ],
    transports: {
        [baseSepolia.id]: http(),
    },
});
