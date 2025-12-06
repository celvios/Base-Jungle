import { useEffect, useState } from 'react';
import { AlertCircle, Smartphone, QrCode, Mail } from 'lucide-react';
import { isMobile } from '@/lib/mobile-wallet';

export function MobileWalletGuide() {
    const [showGuide, setShowGuide] = useState(false);
    const [hasEthereum, setHasEthereum] = useState(false);

    useEffect(() => {
        // Only show on mobile
        if (!isMobile()) return;

        // Check if window.ethereum exists (in-app browser)
        const ethereum = (window as any).ethereum;
        setHasEthereum(!!ethereum);

        // Show guide if no ethereum detected (standard browser)
        if (!ethereum) {
            setShowGuide(true);
        }
    }, []);

    if (!showGuide) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom">
            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="font-semibold text-sm text-orange-100 mb-1">
                                Mobile Wallet Connection
                            </h3>
                            <p className="text-xs text-orange-200/80">
                                Standard mobile browsers can't auto-detect wallet apps. Choose an option:
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Option 1: In-App Browser */}
                            <div className="bg-black/20 rounded p-3 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-medium text-green-400">Recommended</span>
                                </div>
                                <p className="text-xs text-white/90">
                                    Open this site in <strong>MetaMask's browser</strong>
                                </p>
                                <p className="text-xs text-white/60">
                                    MetaMask app → Browser tab → Enter URL
                                </p>
                            </div>

                            {/* Option 2: WalletConnect */}
                            <div className="bg-black/20 rounded p-3 space-y-1">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs font-medium text-blue-400">Alternative</span>
                                </div>
                                <p className="text-xs text-white/90">
                                    Use <strong>WalletConnect</strong> from this browser
                                </p>
                                <p className="text-xs text-white/60">
                                    Connect → WalletConnect → Approve in app
                                </p>
                            </div>

                            {/* Option 3: Email */}
                            <div className="bg-black/20 rounded p-3 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-400">Easiest</span>
                                </div>
                                <p className="text-xs text-white/90">
                                    Use <strong>Email login</strong> (instant wallet)
                                </p>
                                <p className="text-xs text-white/60">
                                    Connect → Email → Verify → Done
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowGuide(false)}
                            className="text-xs text-orange-300 hover:text-orange-200 underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
