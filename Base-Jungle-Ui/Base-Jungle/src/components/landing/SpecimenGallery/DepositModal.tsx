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
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
                    >
                        <div className={`
                            bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden 
                            shadow-[0_0_50px_rgba(0,0,0,0.5)] relative
                        `}>
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-start relative overflow-hidden">
                                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-${tier.borderColor.split('-')[1]}-500 to-transparent`} />

                                <div className="relative z-10">
                                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Target Status</div>
                                    <h2 className={`text-2xl font-bold font-mono ${tier.color}`}>{tier.name}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="relative z-10 p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Deposit Amount (USDC)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
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

                                {/* Info Box */}
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

                                {/* Warning */}
                                <div className="flex gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                    <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                                        Funds are deposited into the {tier.name} Vault Strategy.
                                        Withdrawals may be subject to a 24h lock-up period.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/5 bg-white/5">
                                <Button
                                    onClick={handleDeposit}
                                    disabled={isDepositing}
                                    className={`
                                        w-full h-12 text-sm font-mono uppercase tracking-widest
                                        bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
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
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DepositModal;
