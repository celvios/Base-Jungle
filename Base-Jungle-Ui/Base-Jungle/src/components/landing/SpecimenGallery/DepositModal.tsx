import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: any;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, tier }) => {
    const [amount, setAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);

    useEffect(() => {
        if (tier) {
            // Pre-fill with minimum price, removing '$' and ','
            const price = tier.price.replace(/[^0-9.]/g, '');
            setAmount(price);
        }
    }, [tier]);

    const handleDeposit = async () => {
        setIsDepositing(true);
        // Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsDepositing(false);
        alert(`Successfully deposited $${amount} for ${tier.name} tier!`);
        onClose();
    };

    if (!tier) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">USDC</div>
                </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>Wallet Balance: $12,450.00</span>
                <span className="text-blue-400 cursor-pointer hover:text-blue-300">Max</span>
            </div>
        </div>

                                {/* Info Box */ }
    <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Benefits Unlocked</span>
        </div>
        <ul className="space-y-2">
            {tier.benefits.slice(0, 3).map((benefit: string, i: number) => (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5" />
                    {benefit}
                </li>
            ))}
        </ul>
    </div>

    {/* Warning */ }
    <div className="flex gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
        text-white shadow-lg shadow-blue-500/20
                                    `}
        >
        {isDepositing ? (
            <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
            </span>
        ) : (
            <span className="flex items-center gap-2">
                Confirm Deposit <ArrowRight className="w-4 h-4" />
            </span>
        )}
    </Button>
                            </div >
                        </div >
                    </motion.div >
                </>
            )}
        </AnimatePresence >
    );
};

export default DepositModal;
