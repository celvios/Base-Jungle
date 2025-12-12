import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUpRight, Clock, DollarSign } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { type Address } from 'viem';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    vaultAddress: Address;
    vaultName: string;
    totalAmount: number;
}

const VAULT_ABI = [
    {
        name: 'depositTimestamp',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'withdrawalLockPeriod',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    }
] as const;

const SIXTY_DAYS = 60 * 24 * 60 * 60; // 60 days in seconds

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
    isOpen,
    onClose,
    vaultAddress,
    vaultName,
    totalAmount
}) => {
    const { address } = useAccount();

    // Get user's deposit timestamp
    const { data: depositTimestamp } = useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'depositTimestamp',
        args: address ? [address] : undefined,
        query: { enabled: !!address && isOpen }
    });

    // Get withdrawal lock period
    const { data: lockPeriod } = useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'withdrawalLockPeriod',
        query: { enabled: isOpen }
    });

    // Calculate if early withdrawal and penalty
    const withdrawalInfo = useMemo(() => {
        if (!depositTimestamp || !lockPeriod) {
            return {
                isEarlyWithdrawal: false,
                penaltyPercent: 0,
                penaltyAmount: 0,
                finalAmount: totalAmount,
                daysRemaining: 0,
                maturityDate: null
            };
        }

        const now = Math.floor(Date.now() / 1000);
        const depositTime = Number(depositTimestamp);
        const lockSeconds = Number(lockPeriod);
        const maturityTime = depositTime + lockSeconds;
        const isEarly = now < maturityTime;

        const penaltyPercent = isEarly ? 10 : 0;
        const penaltyAmount = isEarly ? totalAmount * 0.10 : 0;
        const finalAmount = totalAmount - penaltyAmount;
        const daysRemaining = isEarly ? Math.ceil((maturityTime - now) / (24 * 60 * 60)) : 0;
        const maturityDate = new Date(maturityTime * 1000);

        return {
            isEarlyWithdrawal: isEarly,
            penaltyPercent,
            penaltyAmount,
            finalAmount,
            daysRemaining,
            maturityDate
        };
    }, [depositTimestamp, lockPeriod, totalAmount]);

    const handleWithdraw = () => {
        // TODO: Implement actual withdrawal transaction
        console.log('Withdrawing:', withdrawalInfo.finalAmount);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                        Withdraw from {vaultName}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {withdrawalInfo.isEarlyWithdrawal
                            ? 'Early withdrawal penalty applies'
                            : 'Withdraw your full balance'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Early Withdrawal Warning */}
                    {withdrawalInfo.isEarlyWithdrawal && (
                        <div className="p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/10">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-yellow-400 mb-1">Early Withdrawal Penalty</h4>
                                    <p className="text-xs text-gray-300 mb-2">
                                        You're withdrawing before the 60-day maturity period. A 10% penalty will be applied.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{withdrawalInfo.daysRemaining} days until maturity ({withdrawalInfo.maturityDate?.toLocaleDateString()})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Withdrawal Breakdown */}
                    <div className="glass-card p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total Balance</span>
                            <span className="text-sm font-mono text-white">${totalAmount.toFixed(2)}</span>
                        </div>

                        {withdrawalInfo.isEarlyWithdrawal && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Early Withdrawal Penalty (10%)</span>
                                    <span className="text-sm font-mono text-red-400">-${withdrawalInfo.penaltyAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-800 pt-3"></div>
                            </>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white">You Will Receive</span>
                            <span className="text-lg font-bold font-mono text-green-400">
                                ${withdrawalInfo.finalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-gray-300">
                            <strong className="text-blue-400">Note:</strong> Withdrawing will exit all strategy positions and return funds to your wallet.
                            {!withdrawalInfo.isEarlyWithdrawal && ' No penalties apply after maturity.'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-gray-700 hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleWithdraw}
                            className={`flex-1 ${withdrawalInfo.isEarlyWithdrawal
                                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/40'
                                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40'
                                }`}
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            {withdrawalInfo.isEarlyWithdrawal ? 'Withdraw Anyway' : 'Confirm Withdrawal'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawModal;
