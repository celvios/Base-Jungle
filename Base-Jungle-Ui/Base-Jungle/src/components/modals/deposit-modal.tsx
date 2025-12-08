import { useState, useEffect } from "react";
import { Plus, Loader2, CheckCircle2, ArrowDownToLine, AlertCircle } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useApproveUSDC, useVaultDeposit, useUSDCBalance, useVaultMinimumDeposit, formatUSDC } from "@/hooks/use-vault";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { getTokenDisplayName } from "@/constants/tokens";

type TransactionState = "input" | "approving" | "depositing" | "success";

export function DepositModal() {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const [amount, setAmount] = useState("");
    const [txState, setTxState] = useState<TransactionState>("input");
    const [error, setError] = useState<string | null>(null);

    // Get user's USDC balance
    const { data: usdcBalance } = useUSDCBalance(address);
    const balance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;

    // Get user settings to determine target vault
    const { data: settings } = useUserSettingsContract(address);
    const { isActive: leverageIsActive, currentMultiplier } = useLeverageManager(address);

    // Determine which vault to deposit into based on settings
    const getTargetVault = () => {
        if (leverageIsActive) {
            const baseAPY = 12.0; // Aggressive vault base
            const leverageBoost = ((currentMultiplier || 1) - 1) * 3.5;
            return {
                name: "Aggressive Vault",
                address: import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS,
                multiplier: currentMultiplier || 1,
                apy: Number((baseAPY + leverageBoost).toFixed(1)),
            };
        }

        const riskLevel = settings?.riskLevel || 0;
        if (riskLevel === 0) {
            return {
                name: "Conservative Vault",
                address: import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS,
                multiplier: 1,
                apy: 5.5, // Conservative estimate for stablecoin lending
            };
        }

        return {
            name: "Aggressive Vault",
            address: import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS,
            multiplier: 1,
            apy: 12.0, // Base aggressive vault estimate
        };
    };

    const targetVault = getTargetVault();
    const numAmount = parseFloat(amount) || 0;

    // Get minimum deposit for this user
    const { data: minDepositRaw } = useVaultMinimumDeposit(targetVault.address, address);
    const minDeposit = minDepositRaw ? Number(formatUSDC(minDepositRaw)) : 0;

    // Hooks for approval and deposit
    const { write: approve, isLoading: isApproving } = useApproveUSDC(
        targetVault.address,
        numAmount.toString()
    );

    const { write: deposit, isLoading: isDepositing } = useVaultDeposit(
        targetVault.address
    );

    const handleMaxClick = () => {
        setAmount(balance.toString());
        setError(null);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
        setError(null);
    };

    const handleDeposit = async () => {
        if (!approve || !deposit) return;

        // Validation
        if (numAmount < minDeposit) {
            setError(`Minimum deposit is $${minDeposit} for your tier`);
            return;
        }

        try {
            // Step 1: Approve USDC
            setTxState("approving");
            await approve(numAmount.toString());

            // Wait a bit for approval to confirm
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Deposit
            setTxState("depositing");
            await deposit(numAmount.toString(), address!);

            // Success
            setTxState("success");
            setTimeout(() => {
                closeModal();
            }, 2000);
        } catch (error) {
            console.error("Deposit failed:", error);
            setTxState("input");
            setError("Transaction failed. Please try again.");
        }
    };

    const getEstimatedYield = () => {
        return ((numAmount * targetVault.apy) / 100 / 365).toFixed(2);
    };

    return (
        <ModalContainer onClose={closeModal} title="DEPOSIT FUNDS">
            <div className="space-y-6">
                {txState === "success" ? (
                    // Success State
                    <div className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
                        <p className="text-gray-400">Your funds are now earning yield</p>
                    </div>
                ) : (
                    <>
                        {/* Target Vault Info */}
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-blue-400 font-bold">DEPOSIT DESTINATION</span>
                            </div>
                            <div className="text-sm text-white font-medium">{targetVault.name}</div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">APY (estimated)</span>
                                <span className="text-sm font-mono font-bold text-green-400">
                                    {targetVault.apy}%
                                </span>
                            </div>
                            {targetVault.multiplier > 1 && (
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-400">Leverage</span>
                                    <span className="text-sm font-mono font-bold text-yellow-400">
                                        {targetVault.multiplier}x
                                    </span>
                                </div>
                            )}
                            {/* Minimum Deposit Display */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-500/20">
                                <span className="text-xs text-gray-400">Minimum Deposit</span>
                                <span className="text-sm font-mono font-bold text-white">
                                    ${minDeposit.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">DEPOSIT AMOUNT</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder={`Min: ${minDeposit}`}
                                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white font-mono text-lg focus:outline-none transition-colors ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500/50"
                                        }`}
                                    disabled={txState !== "input"}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">{getTokenDisplayName('USDC')}</span>
                                    <button
                                        onClick={handleMaxClick}
                                        className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-400 font-bold transition-colors"
                                        disabled={txState !== "input"}
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2 text-xs">
                                <span className="text-gray-500">
                                    Balance: {balance.toLocaleString()} {getTokenDisplayName('USDC')}
                                </span>
                                {numAmount > 0 && (
                                    <span className="text-green-400">
                                        Daily yield: ~${getEstimatedYield()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        {numAmount > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-xs text-gray-400 mb-1">Estimated Daily</div>
                                    <div className="text-lg font-mono font-bold text-green-400">
                                        ${getEstimatedYield()}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-xs text-gray-400 mb-1">Estimated Yearly</div>
                                    <div className="text-lg font-mono font-bold text-green-400">
                                        ${(numAmount * targetVault.apy / 100).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleDeposit}
                            disabled={!numAmount || numAmount > balance || txState !== "input" || !!error}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {txState === "approving" && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Approving {getTokenDisplayName('USDC')}...
                                </>
                            )}
                            {txState === "depositing" && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Depositing...
                                </>
                            )}
                            {txState === "input" && (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Deposit {numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <p className="text-xs text-yellow-300">
                                <strong>Note:</strong> This is a 2-step process. First approve {getTokenDisplayName('USDC')}, then deposit.
                                Gas fees apply to both transactions.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </ModalContainer>
    );
}
