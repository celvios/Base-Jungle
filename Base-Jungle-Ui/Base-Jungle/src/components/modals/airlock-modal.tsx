import { useState } from "react";
import { RotateCw, Check, AlertCircle, ExternalLink } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";

const WALLETS = [
  { id: "metamask", name: "MetaMask", icon: "🦊", popular: true },
  { id: "coinbase", name: "Coinbase Wallet", icon: "◆", popular: true },
  { id: "walletconnect", name: "WalletConnect", icon: "◎", popular: false },
  { id: "rabby", name: "Rabby", icon: "🐰", popular: false },
];

type ConnectionState = "select" | "connecting" | "verifying" | "connected" | "wrong-network";

export function AirlockModal() {
  const { closeModal, setModalData } = useModal();
  const [connectionState, setConnectionState] = useState<ConnectionState>("select");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  
  // Mock connected wallet data
  const mockAddress = "0x742d35Cc6634C0532925a3b8D1234567890abcDEF";
  const mockBalance = 1234.56;
  const currentNetwork = "Base Mainnet";
  const expectedNetwork = "Base Mainnet";

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
    setConnectionState("connecting");
    
    // Simulate wallet connection
    setTimeout(() => {
      setConnectionState("verifying");
      
      // Simulate network verification
      setTimeout(() => {
        // Randomly show wrong network for demo
        const isCorrectNetwork = Math.random() > 0.3;
        
        if (isCorrectNetwork) {
          setConnectionState("connected");
          setModalData({ selectedWallet: walletId, address: mockAddress });
          
          // Auto-close after showing success
          setTimeout(closeModal, 2000);
        } else {
          setConnectionState("wrong-network");
        }
      }, 1500);
    }, 1500);
  };

  const handleSwitchNetwork = () => {
    setConnectionState("verifying");
    setTimeout(() => {
      setConnectionState("connected");
      setTimeout(closeModal, 2000);
    }, 1500);
  };

  // Wrong Network State
  if (connectionState === "wrong-network") {
    return (
      <ModalContainer onClose={closeModal} title="NETWORK MISMATCH">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-yellow-400">INCORRECT NETWORK</h3>
            <p className="text-blue-300/70 max-w-sm">
              Base Jungle requires connection to {expectedNetwork}
            </p>
          </div>

          <div className="w-full space-y-3 text-sm">
            <div className="flex justify-between p-3 rounded border border-yellow-500/20 bg-yellow-500/5">
              <span className="text-blue-300">Current Network:</span>
              <span className="font-mono font-bold text-yellow-400">Ethereum Mainnet</span>
            </div>
            <div className="flex justify-between p-3 rounded border border-blue-500/20 bg-blue-500/5">
              <span className="text-blue-300">Required Network:</span>
              <span className="font-mono font-bold text-blue-400">{expectedNetwork}</span>
            </div>
          </div>

          <button
            onClick={handleSwitchNetwork}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded transition-all glow-button"
            data-testid="button-switch-network"
          >
            SWITCH TO BASE MAINNET
          </button>
        </div>
      </ModalContainer>
    );
  }

  // Connected State
  if (connectionState === "connected") {
    return (
      <ModalContainer onClose={closeModal} title="AIRLOCK">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-pulse">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-green-400">ACCESS GRANTED</h3>

          <div className="w-full space-y-3">
            <div className="p-4 rounded border border-green-500/20 bg-green-500/5">
              <div className="text-xs text-blue-400/60 mb-1">WALLET ADDRESS</div>
              <div className="font-mono text-sm text-green-400 flex items-center gap-2">
                {mockAddress.slice(0, 6)}...{mockAddress.slice(-4)}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </div>
            </div>
            
            <div className="p-4 rounded border border-blue-500/20 bg-blue-500/5">
              <div className="text-xs text-blue-400/60 mb-1">USDC BALANCE</div>
              <div className="font-mono text-lg font-bold text-blue-300">
                ${mockBalance.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded border border-blue-500/20 bg-blue-500/5">
              <div className="text-xs text-blue-400/60 mb-1">NETWORK</div>
              <div className="font-mono text-sm text-blue-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {currentNetwork}
              </div>
            </div>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // Connecting/Verifying States
  if (connectionState === "connecting" || connectionState === "verifying") {
    return (
      <ModalContainer onClose={closeModal} title="AIRLOCK">
        <div className="flex flex-col items-center gap-8 py-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg
              className="w-full h-full animate-spin-slow"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="25"
                y="25"
                width="50"
                height="50"
                fill="none"
                stroke="#0052FF"
                strokeWidth="1"
                opacity="0.8"
              />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#0052FF"
                strokeWidth="1"
                opacity="0.6"
              />
            </svg>
            <RotateCw className="absolute w-8 h-8 text-blue-500 animate-spin" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-blue-300">
              {connectionState === "connecting" 
                ? "ESTABLISHING CONNECTION" 
                : "VERIFYING NETWORK"}
            </h3>
            <p className="text-sm text-blue-300/70 animate-pulse">
              {connectionState === "connecting"
                ? `Connecting to ${selectedWallet}...`
                : "Confirming Base Mainnet connection..."}
            </p>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent scan-line" />
        </div>
      </ModalContainer>
    );
  }

  // Initial Selection State
  return (
    <ModalContainer onClose={closeModal} title="AIRLOCK">
      <div className="flex flex-col gap-6">
        {/* Info Banner */}
        <div className="p-4 rounded border border-blue-500/20 bg-blue-500/5">
          <p className="text-sm text-blue-300/70 text-center">
            Connect your wallet to access Base Jungle vaults
          </p>
        </div>

        {/* Wallet Selection */}
        <div className="space-y-3">
          <div className="text-xs text-blue-400/60 font-medium mb-2">
            POPULAR WALLETS
          </div>
          {WALLETS.filter(w => w.popular).map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              className="w-full p-4 rounded border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all group"
              data-testid={`button-wallet-${wallet.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="text-blue-200 group-hover:text-blue-100 font-medium">
                    {wallet.name}
                  </span>
                </div>
                <div className="text-blue-400/40 group-hover:text-blue-400/80">→</div>
              </div>
            </button>
          ))}

          <div className="text-xs text-blue-400/60 font-medium mb-2 mt-6">
            MORE OPTIONS
          </div>
          {WALLETS.filter(w => !w.popular).map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              className="w-full p-3 rounded border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/40 transition-all group"
              data-testid={`button-wallet-${wallet.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{wallet.icon}</span>
                  <span className="text-blue-200/80 group-hover:text-blue-100 text-sm font-medium">
                    {wallet.name}
                  </span>
                </div>
                <div className="text-blue-400/40 group-hover:text-blue-400/80">→</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-xs text-blue-400/40 text-center pt-4 border-t border-blue-500/10">
          By connecting, you agree to the Terms of Service
        </div>
      </div>
    </ModalContainer>
  );
}
