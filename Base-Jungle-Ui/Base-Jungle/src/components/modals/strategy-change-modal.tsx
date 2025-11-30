import { useState } from "react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { Info, TrendingUp, AlertTriangle } from "lucide-react";

interface StrategyChangeModalProps {
    currentStrategy: {
        riskLevel: "low" | "medium" | "high";
        leverageActive: boolean;
        leverageMultiplier: number;
        vault: string;
        apy: number;
    };
    newStrategy: {
        riskLevel: "low" | "medium" | "high";
        leverageActive: boolean;
        leverageMultiplier: number;
        vault: string;
        apy: number;
    };
    hasExistingDeposits: boolean;
    totalDeposited: number;
    onAccept: (rebalanceExisting: boolean) => void;
}

export function StrategyChangeModal({
    currentStrategy,
    newStrategy,
    hasExistingDeposits,
    totalDeposited,
    onAccept,
}: StrategyChangeModalProps) {
    const { closeModal } = useModal();
    const [rebalanceExisting, setRebalanceExisting] = useState(false);

    const getVaultName = (strategy: typeof currentStrategy) => {
        if (strategy.leverageActive) {
            return `Aggressive Vault (${strategy.leverageMultiplier}x Leverage)`;
        }
        if (strategy.riskLevel === "low") return "Conservative Vault";
        if (strategy.riskLevel === "high") return "Base Vault";
        return "Master Vault";
    };

    const apyDiff = newStrategy.apy - currentStrategy.apy;
    const isIncrease = apyDiff > 0;

    return (
        <ModalContainer onClose={closeModal} title="STRATEGY CHANGE">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 backdrop-blur-xl">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300/90">
                        <strong>Review your new strategy</strong> before confirming. This will change how your funds are invested.
                    </div>
                </div>

                {/* Strategy Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Current Strategy */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-400 mb-3">CURRENT STRATEGY</div>
                        <div className="space-y-2">
                            <div>
                                <div className="text-xs text-gray-500">Vault</div>
                                <div className="text-sm font-medium text-white">
                                    {getVaultName(currentStrategy)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Risk Level</div>
                                <div className="text-sm font-medium text-white capitalize">
                                    {currentStrategy.riskLevel}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">APY</div>
                                <div className="text-lg font-mono font-bold text-white">
                                    {currentStrategy.apy}%
                                </div>
                            </div>
                            {currentStrategy.leverageActive && (
                                <div>
                                    <div className="text-xs text-gray-500">Leverage</div>
                                    <div className="text-sm font-bold text-yellow-400">
                                        {currentStrategy.leverageMultiplier}x Active
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* New Strategy */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50">
                        <div className="text-xs text-blue-400 mb-3 font-bold">NEW STRATEGY</div>
                        <div className="space-y-2">
                            <div>
                                <div className="text-xs text-gray-400">Vault</div>
                                <div className="text-sm font-medium text-white">
                                    {getVaultName(newStrategy)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Risk Level</div>
                                <div className="text-sm font-medium text-white capitalize">
                                    {newStrategy.riskLevel}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">APY</div>
                                <div className="text-lg font-mono font-bold text-green-400 flex items-center gap-1">
                                    {newStrategy.apy}%
                                    {isIncrease && (
                                        <span className="text-xs text-green-400">
                                            (+{apyDiff.toFixed(1)}%)
                                        </span>
                                    )}
                                </div>
                            </div>
                            {newStrategy.leverageActive && (
                                <div>
                                    <div className="text-xs text-gray-400">Leverage</div>
                                    <div className="text-sm font-bold text-yellow-400">
                                        {newStrategy.leverageMultiplier}x Active
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* APY Change Visualization */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className={`w-5 h-5 ${isIncrease ? 'text-green-400' : 'text-red-400'}`} />
                            <span className="text-sm font-medium text-white">
                                Expected Yield Change
                            </span>
                        </div>
                        <div className={`text-xl font-mono font-bold ${isIncrease ? 'text-green-400' : 'text-red-400'}`}>
                            {isIncrease ? '+' : ''}{apyDiff.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Existing Deposits Section */}
                {hasExistingDeposits && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-yellow-300 mb-2">
                                    You have existing deposits
                                </div>
                                <div className="text-sm text-gray-300">
                                    Current deposits: <span className="font-mono font-bold">${totalDeposited.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rebalance Option */}
                        <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                            <input
                                type="checkbox"
                                checked={rebalanceExisting}
                                onChange={(e) => setRebalanceExisting(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white mb-1">
                                    Migrate existing funds to new strategy
                                </div>
                                <div className="text-xs text-gray-400">
                                    Your ${totalDeposited.toLocaleString()} will be moved from {getVaultName(currentStrategy)} to {getVaultName(newStrategy)}.
                                    {rebalanceExisting && (
                                        <span className="block mt-2 text-yellow-400">
                                            ⚠️ Network fee required
                                        </span>
                                    )}
                                </div>
                            </div>
                        </label>
                    </div>
                )}

                {/* Action Summary */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="text-xs text-gray-400 mb-2">WHAT WILL HAPPEN:</div>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">✓</span>
                            <span>Future deposits will use the new strategy</span>
                        </li>
                        {hasExistingDeposits && (
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">✓</span>
                                <span>
                                    {rebalanceExisting
                                        ? `Existing $${totalDeposited.toLocaleString()} will be migrated to new vault`
                                        : 'Existing deposits will remain in current vault'
                                    }
                                </span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">✓</span>
                            <span>Settings saved on-chain (requires signature)</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={closeModal}
                        className="px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onAccept(rebalanceExisting)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
                    >
                        Confirm Strategy Change
                    </button>
                </div>
            </div>
        </ModalContainer>
    );
}
