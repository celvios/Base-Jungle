import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from '@/lib/wagmi';
import { useSIWE } from '@/hooks/use-siwe';
import { logMobileConnection } from '@/lib/mobile-wallet';

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

  const connect = async () => {
    logMobileConnection('Connect button clicked');

    // Simply open AppKit modal - it handles everything:
    // - Detects mobile vs desktop automatically
    // - Shows appropriate wallets for each platform
    // - Handles deep linking to wallet apps on mobile
    // - Manages QR codes on desktop
    // - Supports injected providers (in-app browsers)
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
