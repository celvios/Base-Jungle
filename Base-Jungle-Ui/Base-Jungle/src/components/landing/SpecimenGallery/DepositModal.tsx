import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/wallet-context';
import { useUSDCBalance, useApproveUSDC, useVaultDeposit, formatUSDC } from '@/hooks/use-vault';
import { type Address } from 'viem';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: any;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, tier }) => {
    const { address, isConnected, connect } = useWallet();
    const [amount, setAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);

    // Get real USDC balance
    const { data: usdcBalance } = useUSDCBalance(address as Address);
    const balance = usdcBalance ? Number(formatUSDC(usdcBalance)) : 0;

    // Determine target vault based on tier
    const getTargetVault = () => {
        if (!tier) return import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
        if (tier.name === 'Novice' || tier.name === 'Scout') {
            return import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
        }
        return import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address;
    };

    const targetVault = getTargetVault();

    // Hooks for approval and deposit
    const { write: approve, isLoading: isApproving } = useApproveUSDC(
        targetVault,
        amount
    );

    const { write: deposit, isLoading: isDepositingTx } = useVaultDeposit(targetVault);

    useEffect(() => {
        if (tier) {
            // Pre-fill with minimum price, removing '$' and ','
            const price = tier.price.replace(/[^0-9.]/g, '');
            setAmount(price);
        }
    }, [tier]);

    const handleMaxClick = () => {
        setAmount(balance.toString());
    };

    const handleDeposit = async () => {
        if (!isConnected) {
            connect();
            return;
        }

        if (!approve || !deposit || !address) return;

        const numAmount = parseFloat(amount);
        if (numAmount <= 0 || numAmount > balance) return;

        try {
            setIsDepositing(true);

            // Step 1: Approve USDC
            await approve(amount);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Deposit
            await deposit(amount, address);

            // Success
            setTimeout(() => {
                onClose();
                setIsDepositing(false);
            }, 2000);
        } catch (error) {
            console.error('Deposit failed:', error);
            setIsDepositing(false);
        }
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

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Tier Info */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-gray-400 mb-1">Selected Tier</div>
                                <div className="text-xl font-bold text-white">{tier.name}</div>
                                <div className="text-sm text-gray-400 mt-1">Minimum: {tier.price}</div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-mono">Deposit Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0.00"
                                        disabled={!isConnected}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">USDC</div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 font-mono">
                                    <span>
                                        {isConnected
                                            ? `Wallet Balance: $${balance.toLocaleString()}`
                                            : 'Connect wallet to see balance'}
                                    </span>
                                    {isConnected && (
                                        <span
                                            onClick={handleMaxClick}
                                            className="text-blue-400 cursor-pointer hover:text-blue-300"
                                        >
                                            Max
                                        </span>
                                    )}
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
                                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                <p className="text-xs text-yellow-200/80">
                                    Funds will be locked for 60 days. Early withdrawal incurs a 10% penalty.
                                </p>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={handleDeposit}
                                disabled={isDepositing || isApproving || isDepositingTx || (isConnected && (parseFloat(amount) <= 0 || parseFloat(amount) > balance))}
                                className={`
                                        w-full py-6 rounded-xl font-bold text-lg
                                        bg-gradient-to-r from-blue-600 to-purple-600 
                                        hover:from-blue-500 hover:to-purple-500
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-all duration-300
                                        text-white shadow-lg shadow-blue-500/20
                                    `}
                            >
                                {!isConnected ? (
                                    <span className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4" />
                                        Connect Wallet
                                    </span>
                                ) : isApproving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Approving...
                                    </span>
                                ) : isDepositing || isDepositingTx ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Depositing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Confirm Deposit <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DepositModal;

