import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id';

export const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia],
  projectId,
  ssr: false,
});

export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [baseSepolia],
  projectId,
  metadata: {
    name: 'Base Jungle',
    description: 'DeFi Yield Optimization Protocol on Base',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://base-jungle.vercel.app',
    icons: ['https://base-jungle.vercel.app/favicon.png'],
  },
  features: {
    analytics: false,
  },
});

export const config = wagmiAdapter.wagmiConfig;
