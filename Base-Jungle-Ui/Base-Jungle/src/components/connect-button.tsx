import { useWallet } from '@/contexts/wallet-context';
import { isMobile } from '@/lib/mobile-wallet';

export function ConnectButton() {
    const { isConnected, address, connectToReown, connectToMetaMask, disconnect } = useWallet();

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    // On mobile, show MetaMask deep link button
    if (isMobile()) {
        return (
            <button
                onClick={connectToMetaMask}
                className="px-6 py-3 bg-[#F6851B] hover:bg-[#E2761B] text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                Open in MetaMask
            </button>
        );
    }

    // On desktop, show AppKit connect button (includes all wallets + WalletConnect QR)
    return (
        <button
            onClick={connectToReown}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all"
        >
            Connect Wallet
        </button>
    );
}
