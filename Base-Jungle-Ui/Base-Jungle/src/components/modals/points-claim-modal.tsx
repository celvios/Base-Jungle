import { useState } from "react";
import { Trophy, Gift, Target, Zap, X, ExternalLink, AlertCircle } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useClaimDailyPoints } from "@/hooks/use-points";
import { useWallet } from "@/contexts/wallet-context";

interface PointsClaimModalProps {
    points: PointsEarned[];
    totalPoints: number;
}

interface PointsEarned {
    type: "daily" | "holding_bonus" | "new_user" | "referral" | "milestone";
    amount: number;
    description: string;
    date: string;
}

export function PointsClaimModal({ points, totalPoints }: PointsClaimModalProps) {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const { claim, isPending, isConfirming, isSuccess, error, hash } = useClaimDailyPoints();

    const handleClaim = async () => {
        if (!address) return;
        try {
            await claim();
        } catch (err) {
            console.error("Failed to claim points:", err);
        }
    };

    // Error State
    if (error) {
        return (
            <ModalContainer onClose={closeModal} title="CLAIM FAILED">
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <h3 className="text-2xl font-bold text-red-400">TRANSACTION FAILED</h3>

                    <p className="text-blue-300/70 text-center max-w-md">
                        {error.message || "Failed to claim points. Please try again."}
                    </p>

                    <button
                        onClick={closeModal}
                        className="px-6 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </ModalContainer>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <ModalContainer onClose={closeModal} title="POINTS CLAIMED">
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-bounce">
                        <Trophy className="w-10 h-10 text-green-500" />
                    </div>

                    <h3 className="text-3xl font-bold text-green-400">
                        +{totalPoints.toLocaleString()} POINTS
                    </h3>

                    <p className="text-blue-300/70 text-center">
                        Points added to your account!
                    </p>

                    {hash && (
                        <a
                            href={`https://sepolia.basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400/60 font-mono flex items-center gap-2 hover:text-blue-400 transition-colors"
                        >
                            View Transaction
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </ModalContainer>
        );
    }

    // Processing state
    if (isPending || isConfirming) {
        return (
            <ModalContainer onClose={closeModal} title="CLAIMING POINTS">
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

                    <h3 className="text-xl font-bold text-blue-300">
                        {isPending ? "CONFIRM IN WALLET" : "PROCESSING TRANSACTION"}
                    </h3>

                    <p className="text-blue-300/70 text-center max-w-md">
                        {isPending
                            ? "Please confirm the transaction in your wallet to claim your points"
                            : "Transaction submitted. Waiting for confirmation..."
                        }
                    </p>

                    {hash && isConfirming && (
                        <a
                            href={`https://sepolia.basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400/60 font-mono flex items-center gap-2 hover:text-blue-400 transition-colors"
                        >
                            View on Explorer
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </ModalContainer>
        );
    }

    return (
        <ModalContainer onClose={closeModal} title="CLAIM POINTS">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-3">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">REWARDS READY</span>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-300 mb-1">
                        {totalPoints.toLocaleString()} Points
                    </h3>
                    <p className="text-blue-300/60">Available to claim</p>
                </div>

                {/* Points Breakdown */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {points.map((point, index) => {
                        const icon = {
                            daily: <Zap className="w-4 h-4" />,
                            holding_bonus: <Gift className="w-4 h-4" />,
                            new_user: <Target className="w-4 h-4" />,
                            referral: <Trophy className="w-4 h-4" />,
                            milestone: <Trophy className="w-4 h-4" />,
                        }[point.type];

                        const color = {
                            daily: "blue",
                            holding_bonus: "green",
                            new_user: "purple",
                            referral: "yellow",
                            milestone: "pink",
                        }[point.type];

                        return (
                            <div
                                key={index}
                                className={`flex justify-between items-center p-3 rounded border border-${color}-500/20 bg-${color}-500/5`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-${color}-400`}>{icon}</div>
                                    <div>
                                        <div className="text-sm font-medium text-blue-200">
                                            {point.description}
                                        </div>
                                        <div className="text-xs text-blue-400/60">{point.date}</div>
                                    </div>
                                </div>
                                <span className={`font-mono font-bold text-${color}-400`}>
                                    +{point.amount}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center p-4 rounded border-2 border-primary/40 bg-gradient-to-r from-primary/10 to-transparent">
                    <span className="text-blue-200 font-medium">Total Claimable</span>
                    <span className="font-mono font-bold text-2xl text-primary">
                        {totalPoints.toLocaleString()} pts
                    </span>
                </div>

                {/* Info */}
                <div className="p-3 rounded border border-blue-500/20 bg-blue-500/5">
                    <p className="text-xs text-blue-300/70 text-center">
                        💡 Points can be used for tier upgrades, fee discounts, and exclusive perks
                    </p>
                </div>

                {/* Claim Button */}
                <button
                    onClick={handleClaim}
                    disabled={!address || isPending || isConfirming}
                    className="w-full py-4 rounded font-bold text-lg bg-gradient-to-r from-primary to-blue-600 text-white 
                     hover:from-primary/90 hover:to-blue-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-primary/20"
                >
                    {!address ? "CONNECT WALLET" : "CLAIM POINTS"}
                </button>
            </div>
        </ModalContainer>
    );
}
