import React from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { User, LogOut, Copy, Check } from 'lucide-react';
import { useLocation } from 'wouter';

const ProfileMenu: React.FC = () => {
    const { address, disconnect } = useWallet();
    const [, setLocation] = useLocation();
    const [copied, setCopied] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setLocation('/');
    };

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-mono text-gray-300 hidden md:block">{shortAddress}</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wallet Address</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-mono text-white flex-1 truncate">{address}</p>
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Disconnect</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileMenu;
