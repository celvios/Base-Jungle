import { useState } from "react";
import { Zap, AlertTriangle, TrendingUp, Lock, Unlock } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useLeverageManager } from "@/hooks/use-leverage";
import { type Address } from "viem";

export function LeverageControlModal() {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const {
        isUnlocked,
        currentMultiplier,
        maxMultiplier,
        isActive,
        activate,
        deactivate,
        isPending,
    } = useLeverageManager(address as Address);

    const [selectedMultiplier, setSelectedMultiplier] = useState(currentMultiplier || 2);

    const multiplierOptions = [2, 3, 5].filter(m => m <= maxMultiplier);

    const handleActivate = async () => {
        if (!activate) return;
        try {
            await activate(selectedMultiplier);
            setTimeout(closeModal, 2000);
        } catch (error) {
            console.error("Failed to activate leverage:", error);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivate) return;
        try {
            await deactivate();
            setTimeout(closeModal, 2000);
        } catch (error) {
            console.error("Failed to deactivate leverage:", error);
        }
    };

    if (!isUnlocked) {
        return (
            <ModalContainer onClose={closeModal} title="LEVERAGE LOCKED">
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Leverage Not Unlocked</h3>
                    <p className="text-blue-300/70 text-center max-w-md">
                        You need to meet the tier requirements to unlock leverage.
                        Increase your deposits and referrals to unlock this feature.
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

    return (
        <ModalContainer onClose={closeModal} title="LEVERAGE CONTROL">
            <div className="space-y-6">
                {/* Current Status */}
                <div className={`p-4 rounded-xl border ${isActive ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isActive ? (
                                <Unlock className="w-5 h-5 text-green-400" />
                            ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-white">
                                {isActive ? "Leverage Active" : "Leverage Inactive"}
                            </span>
                        </div>
                        {isActive && (
                            <span className="text-lg font-mono font-bold text-green-400">
                                {currentMultiplier}x
                            </span>
                        )}
                    </div>
                </div>

                {!isActive ? (
                    <>
                        {/* Multiplier Selection */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-3">SELECT MULTIPLIER</label>
                            <div className="grid grid-cols-3 gap-3">
                                {multiplierOptions.map((multiplier) => (
                                    <button
                                        key={multiplier}
                                        onClick={() => setSelectedMultiplier(multiplier)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedMultiplier === multiplier
                                            ? "border-blue-500 bg-blue-500/20"
                                            : "border-white/10 bg-white/5 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="text-2xl font-bold text-white">{multiplier}x</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {multiplier === 2 && "Conservative"}
                                            {multiplier === 3 && "Balanced"}
                                            {multiplier === 5 && "Aggressive"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Risk Warning */}
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-yellow-300 space-y-2">
                                    <p className="font-bold">⚠️ Leverage Risks:</p>
                                    <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                                        <li>Higher leverage = Higher risk of liquidation</li>
                                        <li>Monitor your health factor closely</li>
                                        <li>Market volatility can trigger liquidation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-300 space-y-2">
                                    <p className="font-bold">✨ Potential Benefits:</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                                        <li>Amplified returns on successful strategies</li>
                                        <li>Access to advanced yield farming</li>
                                        <li>Increased capital efficiency</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Activate Button */}
                        <button
                            onClick={handleActivate}
                            disabled={isPending}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            {isPending ? "Activating..." : `Activate ${selectedMultiplier}x Leverage`}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Active Leverage Info */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-sm text-gray-400">Current Multiplier</span>
                                <span className="text-lg font-mono font-bold text-green-400">{currentMultiplier}x</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-sm text-gray-400">Max Available</span>
                                <span className="text-lg font-mono font-bold text-white">{maxMultiplier}x</span>
                            </div>
                        </div>

                        {/* Deactivate Warning */}
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-red-300">
                                    <p className="font-bold mb-2">Deactivating Leverage:</p>
                                    <p className="text-red-300/80">
                                        This will close all leveraged positions and return your capital to the base vault.
                                        Any open positions will be settled at current market prices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deactivate Button */}
                        <button
                            onClick={handleDeactivate}
                            disabled={isPending}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <Lock className="w-5 h-5" />
                            {isPending ? "Deactivating..." : "Deactivate Leverage"}
                        </button>
                    </>
                )}
            </div>
        </ModalContainer>
    );
}
