import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from '@/lib/wagmi';
import { useSIWE } from '@/hooks/use-siwe';
import { isMobile, logMobileConnection, getMobileConnectionInstructions } from '@/lib/mobile-wallet';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  // Auth state
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function WalletProviderInner({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();
  const { isAuthenticated, isAuthenticating, authenticate, logout } = useSIWE();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !hasAttemptedAuth && !isAuthenticating) {
      setHasAttemptedAuth(true);
      logMobileConnection('Auto-authenticating', { address });
      authenticate().catch(console.error);
    }

    if (!isConnected) {
      setHasAttemptedAuth(false);
    }
  }, [isConnected, address, isAuthenticated, hasAttemptedAuth, isAuthenticating, authenticate]);

  const { connectAsync, connectors } = useConnect();

  const connect = async () => {
    logMobileConnection('Connect button clicked');

    // Step 1: In-App Browser Detection (MetaMask / Trust Wallet Browser)
    // Check if user is inside a wallet's browser
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const injectedConnector = connectors.find((c) => c.id === 'injected');
      if (injectedConnector) {
        try {
          await connectAsync({ connector: injectedConnector });
          return;
        } catch (error) {
          console.error('Injected connection failed:', error);
          return;
        }
      }
    }

    // Step 2: Mobile Device (not in-app browser) -> Deep Link
    // Redirect to wallet app with our dApp URL
    if (isMobile()) {
      const host = window.location.host;
      const path = window.location.pathname;
      // Remove protocol if present in host (it usually isn't)
      const cleanHost = host.replace(/^https?:\/\//, '');
      const deepLink = `https://metamask.app.link/dapp/${cleanHost}${path}`;

      console.log('Redirecting to deep link:', deepLink);
      window.location.href = deepLink;
      return;
    }

    // Step 3: Desktop -> AppKit Modal (WalletConnect)
    // Universal fallback for desktop or if other methods fail
    open();
  };

  const disconnect = () => {
    logout();
    wagmiDisconnect();
    setHasAttemptedAuth(false);
  };

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        isConnected,
        connect,
        disconnect,
        isAuthenticated,
        isAuthenticating,
        authenticate,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>
          {children}
        </WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
