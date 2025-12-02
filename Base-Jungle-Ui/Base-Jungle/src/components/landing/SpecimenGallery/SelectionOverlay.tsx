import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

interface SelectionOverlayProps {
    activeTier: any;
    onClose: () => void;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ activeTier, onClose }) => {
    const { isConnected } = useAccount();
    const { open } = useAppKit();

    const handleAction = () => {
        if (!isConnected) {
            open();
        } else {
            // TODO: Open actual Deposit Modal or trigger transaction
            console.log(`Opening deposit modal for ${activeTier.name} with amount ${activeTier.price}`);
            // For now, we can show an alert or toast
            alert(`Ready to deposit ${activeTier.price} for ${activeTier.name} tier!`);
        }
    };

    return (
        <AnimatePresence>
            {activeTier && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
                >
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-blue-900/50 rounded-3xl p-12 shadow-[0_0_100px_rgba(0,82,255,0.2)]">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex gap-12">
                            {/* Left: Tier Info */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-2">Selected Target</div>
                                    <h2 className="text-5xl font-bold text-white mb-2">{activeTier.name}</h2>
                                    <div className="text-xl text-gray-400 font-mono">Status Level {activeTier.id}</div>
                                </div>

                                <div className="space-y-4 py-6 border-y border-gray-800">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Yield Multiplier</span>
                                        <span className="text-blue-400 font-bold">{activeTier.multiplier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Max Leverage</span>
                                        <span className="text-purple-400 font-bold">{activeTier.leverage}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Deposit Action */}
                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 text-center">
                                    <div className="text-xs font-mono text-gray-400 uppercase mb-2">Required Deposit</div>
                                    <div className="text-3xl font-mono text-white font-bold">{activeTier.price}</div>
                                </div>

                                <Button
                                    onClick={handleAction}
                                    className={`w-full h-14 font-mono uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(0,82,255,0.4)] transition-all ${isConnected
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                            : 'bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-900/20'
                                        }`}
                                >
                                    {isConnected ? (
                                        <>Deposit & Unlock <ArrowRight className="ml-2 w-5 h-5" /></>
                                    ) : (
                                        <>Connect Wallet <Wallet className="ml-2 w-5 h-5" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SelectionOverlay;
