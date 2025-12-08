import { useState, useEffect } from "react";
import { Plus, Loader2, CheckCircle2, ArrowDownToLine, AlertCircle } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useApproveUSDC, useVaultDeposit, useUSDCBalance, useVaultMinimumDeposit, useUSDCAllowance, formatUSDC } from "@/hooks/use-vault";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { getTokenDisplayName } from "@/constants/tokens";
import { usePublicClient, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { USDC_ADDRESS } from "@/constants/tokens";

type TransactionState = "input" | "approving" | "depositing" | "success";

// ERC20 ABI for allowance check
const ERC20_ABI = [
    {
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export function DepositModal() {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const publicClient = usePublicClient();
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

    // Check current allowance (refetch frequently when approving)
    const { data: currentAllowance, refetch: refetchAllowance } = useUSDCAllowance(
        address,
        targetVault.address
    );
    const allowanceAmount = currentAllowance ? Number(formatUSDC(currentAllowance)) : 0;
    const needsApproval = numAmount > allowanceAmount;

    // Hooks for approval and deposit
    const { approve, approveMax, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApprovalSuccess, hash: approvalHash, error: approvalError } = useApproveUSDC(
        targetVault.address
    );

    // Wait for approval transaction receipt to ensure it's fully confirmed
    const { data: approvalReceipt, isLoading: isWaitingForApprovalReceipt } = useWaitForTransactionReceipt({
        hash: approvalHash,
        confirmations: 2, // Wait for 2 confirmations to ensure state is propagated
    });

    const { deposit, isPending: isDepositing, isConfirming: isDepositingConfirming, isSuccess: isDepositSuccess, error: depositError, hash: depositHash } = useVaultDeposit(
        targetVault.address
    );

    // Add a timeout to reset state if deposit gets stuck
    useEffect(() => {
        if (txState === "depositing" && !isDepositing && !isDepositingConfirming && !depositHash) {
            // If we're in depositing state but no transaction was initiated after 10 seconds, reset
            const timeout = setTimeout(() => {
                console.warn("Deposit state timeout - resetting");
                setTxState("input");
                setError("Deposit transaction was not initiated. Please try again.");
            }, 10000);
            
            return () => clearTimeout(timeout);
        }
    }, [txState, isDepositing, isDepositingConfirming, depositHash]);

    const handleMaxClick = () => {
        setAmount(balance.toString());
        setError(null);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
        setError(null);
    };

    const handleDeposit = () => {
        if (!approve || !deposit || !address) {
            setError("Please connect your wallet");
            return;
        }

        if (!targetVault.address) {
            setError("Vault address not configured");
            return;
        }

        // Validation
        if (numAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (numAmount > balance) {
            setError("Insufficient balance");
            return;
        }

        if (minDeposit > 0 && numAmount < minDeposit) {
            setError(`Minimum deposit is $${minDeposit} for your tier`);
            return;
        }

        // Check if approval is needed
        if (needsApproval) {
            // Step 1: Approve USDC (approve max to avoid future approval issues)
            setTxState("approving");
            setError(null);
            try {
                // Use max approval to avoid allowance issues
                approveMax();
            } catch (error: any) {
                console.error("Approval failed:", error);
                setTxState("input");
                setError(error?.message || "Approval failed. Please try again.");
            }
        } else {
            // Already approved, go straight to deposit
            setTxState("depositing");
            setError(null);
            try {
                deposit(numAmount.toString(), address);
            } catch (error: any) {
                console.error("Deposit call failed:", error);
                setTxState("input");
                setError(error?.message || "Failed to initiate deposit. Please try again.");
            }
        }
    };

    // Handle approval errors
    useEffect(() => {
        if (approvalError && txState === "approving") {
            console.error("Approval error:", approvalError);
            setTxState("input");
            setError(approvalError.message || "Approval failed. Please try again.");
        }
    }, [approvalError, txState]);

    // Auto-proceed to deposit after approval is confirmed AND receipt is received
    useEffect(() => {
        // Only proceed if:
        // 1. Approval transaction was successful
        // 2. We have the transaction receipt (with 2 confirmations)
        // 3. Receipt status is success
        // 4. We're in the approving state
        if (
            isApprovalSuccess && 
            approvalReceipt && 
            approvalReceipt.status === 'success' &&
            txState === "approving" && 
            address && 
            publicClient &&
            !isWaitingForApprovalReceipt
        ) {
            const proceedToDeposit = async () => {
                try {
                    const parsedAmount = parseUnits(numAmount.toString(), 6);

                    // CRITICAL: Wait 3 seconds after receipt to ensure state propagation across all RPC nodes
                    console.log("Approval receipt confirmed, waiting 3 seconds for state propagation...");
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Now verify allowance before depositing
                    let allowanceVerified = false;
                    let attempts = 0;
                    const maxAttempts = 30; // 30 attempts over 15 seconds

                    console.log(`Starting allowance verification (max ${maxAttempts} attempts)...`);

                    while (!allowanceVerified && attempts < maxAttempts) {
                        attempts++;

                        try {
                            const allowance = await publicClient.readContract({
                                address: USDC_ADDRESS,
                                abi: ERC20_ABI,
                                functionName: 'allowance',
                                args: [address, targetVault.address],
                            });

                            console.log(`Allowance check ${attempts}/${maxAttempts}: ${formatUSDC(allowance)} >= ${numAmount} (${allowance.toString()} >= ${parsedAmount.toString()})`);

                            if (allowance >= parsedAmount) {
                                allowanceVerified = true;
                                console.log("✅ Allowance verified! Proceeding with deposit...");

                                // One more small delay to be safe
                                await new Promise(resolve => setTimeout(resolve, 500));

                                setTxState("depositing");
                                setError(null);
                                
                                // Call deposit - it will trigger writeContract which opens wallet popup
                                // Don't await it since writeContract doesn't return a promise
                                try {
                                    deposit(numAmount.toString(), address);
                                    
                                    // Wait a bit to see if transaction was initiated
                                    // If isPending doesn't become true within 5 seconds, something went wrong
                                    let transactionInitiated = false;
                                    for (let i = 0; i < 10; i++) {
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        if (isDepositing) {
                                            transactionInitiated = true;
                                            console.log("✅ Deposit transaction initiated, waiting for user confirmation...");
                                            break;
                                        }
                                    }
                                    
                                    if (!transactionInitiated) {
                                        console.error("❌ Deposit transaction was not initiated");
                                        setTxState("input");
                                        setError("Failed to initiate deposit. Please try again.");
                                    }
                                } catch (error: any) {
                                    console.error("Deposit call failed:", error);
                                    setTxState("input");
                                    setError(error?.message || "Failed to initiate deposit. Please try again.");
                                }
                                break;
                            }
                        } catch (error: any) {
                            console.error(`Allowance check ${attempts} failed:`, error);
                        }

                        // Wait 500ms before next check
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    if (!allowanceVerified) {
                        console.error("❌ Allowance verification failed after all attempts");
                        setTxState("input");
                        setError(`Allowance not updated after ${maxAttempts} attempts. The approval may still be processing. Please wait 10-15 seconds and try depositing manually.`);
                    }
                } catch (error: any) {
                    console.error("Auto-deposit failed:", error);
                    setTxState("input");
                    setError(error?.message || "Failed to proceed with deposit. Please try again.");
                }
            };

            proceedToDeposit();
        }
    }, [isApprovalSuccess, approvalReceipt, txState, address, publicClient, numAmount, targetVault.address, deposit, isWaitingForApprovalReceipt]);

    // Handle deposit success
    useEffect(() => {
        if (isDepositSuccess && txState === "depositing") {
            setTxState("success");
            setTimeout(() => {
                closeModal();
            }, 2000);
        }
    }, [isDepositSuccess, txState, closeModal]);

    // Handle deposit errors
    useEffect(() => {
        if (depositError && txState === "depositing") {
            console.error("Deposit error:", depositError);
            setTxState("input");
            setError(depositError.message || "Deposit failed. Please check your balance and try again.");
        }
    }, [depositError, txState]);

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

                        {/* Allowance Info */}
                        {numAmount > 0 && (
                            <div className="text-xs text-gray-500 text-center">
                                {needsApproval ? (
                                    <span>Approval needed: ${numAmount.toFixed(2)} {getTokenDisplayName('USDC')}</span>
                                ) : (
                                    <span className="text-green-400">✓ Already approved</span>
                                )}
                            </div>
                        )}

                        {/* Show approval success state - auto-proceeding */}
                        {isApprovalSuccess && txState === "approving" && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    {isWaitingForApprovalReceipt || !approvalReceipt ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    )}
                                    <span className="text-sm font-medium text-green-400">
                                        {isWaitingForApprovalReceipt || !approvalReceipt 
                                            ? "Waiting for confirmations..." 
                                            : "Approval Confirmed!"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {isWaitingForApprovalReceipt || !approvalReceipt
                                        ? "Waiting for transaction confirmations to ensure state is synced..."
                                        : "Verifying allowance and proceeding with deposit automatically..."}
                                </p>
                                {approvalHash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${approvalHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400/60 hover:text-blue-400 mt-2 inline-block"
                                    >
                                        View Approval Transaction →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Action Button - Show when not in approval success state */}
                        {!(isApprovalSuccess && txState === "approving") && (
                            <button
                                onClick={handleDeposit}
                                disabled={!numAmount || numAmount > balance || numAmount < minDeposit || txState !== "input" || isApproving || isDepositing || !address}
                                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {(txState === "approving" || isApproving || isApprovingConfirming) && (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isApproving ? "Confirm approval in wallet..." : isApprovingConfirming ? "Approving..." : `Approving ${getTokenDisplayName('USDC')}...`}
                                    </>
                                )}
                                {(txState === "depositing" || isDepositing || isDepositingConfirming) && (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isDepositing ? "Confirm deposit in wallet..." : isDepositingConfirming ? "Processing deposit..." : "Preparing deposit..."}
                                    </>
                                )}
                                {txState === "input" && !isApproving && !isDepositing && !isApprovingConfirming && !isDepositingConfirming && (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        {needsApproval ? `Approve & Deposit ${numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}` : `Deposit ${numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}`}
                                    </>
                                )}
                            </button>
                        )}

                        {/* Show transaction hashes */}
                        {depositHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${depositHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400/60 hover:text-blue-400 text-center block"
                            >
                                View Deposit Transaction →
                            </a>
                        )}

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
