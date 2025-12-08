import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, CheckCircle2, ArrowDownToLine, AlertCircle } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useUSDCBalance, useVaultMinimumDeposit, useUSDCAllowance, formatUSDC } from "@/hooks/use-vault";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { getTokenDisplayName, USDC_ADDRESS } from "@/constants/tokens";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

// ERC20 ABI for approve
const ERC20_ABI = [
    {
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

// Vault ABI for deposit
const VAULT_ABI = [
    {
        inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
        name: 'deposit',
        outputs: [{ name: 'shares', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

type Step = "input" | "approving" | "approved" | "depositing" | "success";

export function DepositModal() {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState<Step>("input");
    const [error, setError] = useState<string | null>(null);
    const depositCalledRef = useRef(false);

    // Get user's USDC balance
    const { data: usdcBalance } = useUSDCBalance(address);
    const balance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;

    // Get user settings to determine target vault
    const { data: settings } = useUserSettingsContract(address);
    const { isActive: leverageIsActive, currentMultiplier } = useLeverageManager(address);

    // Determine which vault to deposit into based on settings
    const getTargetVault = () => {
        if (leverageIsActive) {
            const baseAPY = 12.0;
            const leverageBoost = ((currentMultiplier || 1) - 1) * 3.5;
            return {
                name: "Aggressive Vault",
                address: import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as `0x${string}`,
                multiplier: currentMultiplier || 1,
                apy: Number((baseAPY + leverageBoost).toFixed(1)),
            };
        }

        const riskLevel = settings?.riskLevel || 0;
        if (riskLevel === 0) {
            return {
                name: "Conservative Vault",
                address: import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as `0x${string}`,
                multiplier: 1,
                apy: 5.5,
            };
        }

        return {
            name: "Aggressive Vault",
            address: import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as `0x${string}`,
            multiplier: 1,
            apy: 12.0,
        };
    };

    const targetVault = getTargetVault();
    const numAmount = parseFloat(amount) || 0;
    const parsedAmount = numAmount > 0 ? parseUnits(numAmount.toString(), 6) : BigInt(0);

    // DEBUG: Log environment variables on mount
    useEffect(() => {
        console.log("🔴 ENV CHECK - Vault addresses from environment:");
        console.log("🔴 VITE_CONSERVATIVE_VAULT_ADDRESS:", import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS);
        console.log("🔴 VITE_AGGRESSIVE_VAULT_ADDRESS:", import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS);
        console.log("🔴 VITE_USDC_ADDRESS:", import.meta.env.VITE_USDC_ADDRESS);
        console.log("🔴 Target vault being used:", targetVault.address);
        console.log("🔴 Expected Conservative:", "0xf1390Ba2304e0764A92c8bAdbAEFBA2b24e841E9");
        console.log("🔴 Expected Aggressive:", "0x534028D42C6750340e32c2006Ed7e20ea8C993Ee");
    }, [targetVault.address]);

    // Get minimum deposit for this user
    const { data: minDepositRaw } = useVaultMinimumDeposit(targetVault.address, address);
    const minDeposit = minDepositRaw ? Number(formatUSDC(minDepositRaw)) : 0;

    // Check current allowance
    const { data: currentAllowance, refetch: refetchAllowance } = useUSDCAllowance(address, targetVault.address);
    const hasEnoughAllowance = currentAllowance ? currentAllowance >= parsedAmount : false;

    // APPROVAL: Write contract + wait for receipt
    const { 
        writeContract: writeApprove, 
        data: approveHash, 
        isPending: isApprovePending,
        error: approveError,
        reset: resetApprove
    } = useWriteContract();

    const { 
        isLoading: isApproveConfirming, 
        isSuccess: isApproveSuccess,
        data: approveReceipt
    } = useWaitForTransactionReceipt({ 
        hash: approveHash,
        confirmations: 1
    });

    // DEPOSIT: Write contract + wait for receipt
    const { 
        writeContract: writeDeposit, 
        data: depositHash, 
        isPending: isDepositPending,
        error: depositError,
        reset: resetDeposit
    } = useWriteContract();

    const { 
        isLoading: isDepositConfirming, 
        isSuccess: isDepositSuccess 
    } = useWaitForTransactionReceipt({ 
        hash: depositHash,
        confirmations: 1
    });

    // Handle approve click
    const handleApprove = () => {
        console.log("🔵 handleApprove called");
        console.log("🔵 Address:", address);
        console.log("🔵 Target vault:", targetVault.address);
        console.log("🔵 USDC Address:", USDC_ADDRESS);
        
        if (!address || !targetVault.address) {
            console.log("❌ Missing address or vault");
            return;
        }
        
        setError(null);
        setStep("approving");
        depositCalledRef.current = false;
        
        // Approve max uint256
        const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        
        console.log("🔵 Calling writeApprove with max amount...");
        
        writeApprove({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [targetVault.address, maxAmount],
        });
        
        console.log("🔵 writeApprove called");
    };

    // Handle deposit click
    const handleDeposit = () => {
        console.log("🟣 handleDeposit called");
        console.log("🟣 Address:", address);
        console.log("🟣 Target vault:", targetVault.address);
        console.log("🟣 numAmount:", numAmount);
        console.log("🟣 parsedAmount:", parsedAmount.toString());
        
        if (!address || !targetVault.address || numAmount <= 0) {
            console.log("❌ handleDeposit validation failed:", { address, vault: targetVault.address, numAmount });
            return;
        }
        
        setError(null);
        setStep("depositing");
        
        console.log("🟣 Calling writeDeposit...");
        console.log("🟣 Vault address:", targetVault.address);
        console.log("🟣 Args:", [parsedAmount.toString(), address]);
        
        try {
            writeDeposit({
                address: targetVault.address,
                abi: VAULT_ABI,
                functionName: 'deposit',
                args: [parsedAmount, address],
            });
            console.log("🟣 writeDeposit called successfully");
        } catch (err) {
            console.error("🟣 writeDeposit threw error:", err);
        }
    };

    // Handle main button click
    const handleMainAction = () => {
        console.log("🟢 handleMainAction called");
        console.log("🟢 hasEnoughAllowance:", hasEnoughAllowance);
        console.log("🟢 Current allowance:", currentAllowance?.toString());
        console.log("🟢 Parsed amount:", parsedAmount.toString());
        
        if (!address) {
            setError("Please connect your wallet");
            return;
        }

        if (!targetVault.address) {
            setError("Vault address not configured");
            return;
        }

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

        // If we need approval, do that first
        if (!hasEnoughAllowance) {
            console.log("🟢 Needs approval, calling handleApprove");
            handleApprove();
        } else {
            // Already approved, deposit directly
            console.log("🟢 Already approved, calling handleDeposit");
            handleDeposit();
        }
    };

    // Log approval state changes
    useEffect(() => {
        console.log("🟡 Approval state:", {
            isApprovePending,
            isApproveConfirming,
            isApproveSuccess,
            approveHash,
            approveReceipt: approveReceipt ? "received" : "none",
            approveError: approveError?.message || "none",
            step
        });
    }, [isApprovePending, isApproveConfirming, isApproveSuccess, approveHash, approveReceipt, approveError, step]);

    // Log deposit state changes
    useEffect(() => {
        console.log("🟠 Deposit state:", {
            isDepositPending,
            isDepositConfirming,
            isDepositSuccess,
            depositHash,
            depositError: depositError?.message || "none",
            step
        });
    }, [isDepositPending, isDepositConfirming, isDepositSuccess, depositHash, depositError, step]);

    // AUTO-PROCEED: When approval is confirmed, wait a bit then deposit
    useEffect(() => {
        if (isApproveSuccess && approveReceipt && step === "approving" && !depositCalledRef.current) {
            console.log("✅ Approval confirmed!");
            console.log("📋 Approval TX:", approveHash);
            console.log("🏦 Vault address:", targetVault.address);
            console.log("💰 USDC address:", USDC_ADDRESS);
            console.log("💵 Amount:", numAmount, "parsed:", parsedAmount.toString());
            console.log("👤 User address:", address);
            
            setStep("approved");
            
            // Wait 10 seconds for state propagation across all RPC nodes
            const timer = setTimeout(async () => {
                if (depositCalledRef.current) return;
                depositCalledRef.current = true;
                
                console.log("⏳ Refetching allowance after 10s wait...");
                const { data: newAllowance } = await refetchAllowance();
                console.log("📊 New allowance:", newAllowance?.toString());
                
                console.log("🚀 Starting deposit to vault:", targetVault.address);
                console.log("🚀 Deposit amount:", parsedAmount.toString());
                console.log("🚀 Receiver:", address);
                
                setStep("depositing");
                
                writeDeposit({
                    address: targetVault.address,
                    abi: VAULT_ABI,
                    functionName: 'deposit',
                    args: [parsedAmount, address!],
                });
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isApproveSuccess, approveReceipt, step]);

    // Handle deposit success
    useEffect(() => {
        if (isDepositSuccess && step === "depositing") {
            console.log("🎉 Deposit successful!");
            setStep("success");
            setTimeout(() => closeModal(), 2000);
        }
    }, [isDepositSuccess, step, closeModal]);

    // Handle errors
    useEffect(() => {
        if (approveError && step === "approving") {
            console.error("Approve error:", approveError);
            setStep("input");
            setError(approveError.message || "Approval failed. Please try again.");
            resetApprove();
        }
    }, [approveError, step, resetApprove]);

    useEffect(() => {
        if (depositError && step === "depositing") {
            console.error("Deposit error:", depositError);
            setStep("input");
            setError(depositError.message || "Deposit failed. Please try again.");
            resetDeposit();
            depositCalledRef.current = false;
        }
    }, [depositError, step, resetDeposit]);

    const getEstimatedYield = () => {
        return ((numAmount * targetVault.apy) / 100 / 365).toFixed(2);
    };

    // Determine button state and text
    const getButtonContent = () => {
        if (step === "approving" || isApprovePending || isApproveConfirming) {
            return (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isApprovePending ? "Confirm in wallet..." : "Approving..."}
                </>
            );
        }
        
        if (step === "approved") {
            return (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing deposit...
                </>
            );
        }

        if (step === "depositing" || isDepositPending || isDepositConfirming) {
            return (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isDepositPending ? "Confirm deposit in wallet..." : "Processing deposit..."}
                </>
            );
        }

        // Input state
        if (!hasEnoughAllowance && numAmount > 0) {
            return (
                <>
                    <Plus className="w-5 h-5" />
                    Approve & Deposit {numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}
                </>
            );
        }

        return (
            <>
                <Plus className="w-5 h-5" />
                Deposit {numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}
            </>
        );
    };

    const isButtonDisabled = 
        !numAmount || 
        numAmount > balance || 
        numAmount < minDeposit || 
        step !== "input" || 
        isApprovePending || 
        isApproveConfirming ||
        isDepositPending ||
        isDepositConfirming ||
        !address;

    return (
        <ModalContainer onClose={closeModal} title="DEPOSIT FUNDS">
            <div className="space-y-6">
                {step === "success" ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
                        <p className="text-gray-400">Your funds are now earning yield</p>
                        {depositHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${depositHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 mt-4"
                            >
                                View Transaction →
                            </a>
                        )}
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
                                    onChange={(e) => { setAmount(e.target.value); setError(null); }}
                                    placeholder={`Min: ${minDeposit}`}
                                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white font-mono text-lg focus:outline-none transition-colors ${
                                        error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500/50"
                                    }`}
                                    disabled={step !== "input"}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">{getTokenDisplayName('USDC')}</span>
                                    <button
                                        onClick={() => { setAmount(balance.toString()); setError(null); }}
                                        className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-400 font-bold transition-colors"
                                        disabled={step !== "input"}
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>

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

                        {/* Allowance Info - only show if approval needed */}
                        {numAmount > 0 && !hasEnoughAllowance && (
                            <div className="text-xs text-gray-500 text-center">
                                <span>Approval needed for {getTokenDisplayName('USDC')}</span>
                            </div>
                        )}

                        {/* Progress indicator for approval */}
                        {(step === "approving" || step === "approved") && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    {step === "approved" ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                                    )}
                                    <span className="text-sm font-medium text-green-400">
                                        {step === "approved" ? "Approval Confirmed!" : "Approving..."}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {step === "approved" 
                                        ? "Waiting 10 seconds for blockchain sync, then depositing automatically..."
                                        : "Please confirm the approval transaction in your wallet."}
                                </p>
                                {approveHash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${approveHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400/60 hover:text-blue-400 mt-2 inline-block"
                                    >
                                        View Approval TX →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Depositing indicator */}
                        {step === "depositing" && (
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    <span className="text-sm font-medium text-blue-400">
                                        {isDepositPending ? "Confirm in wallet..." : "Processing deposit..."}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {isDepositPending 
                                        ? "Please confirm the deposit transaction in your wallet."
                                        : "Your deposit is being processed on the blockchain."}
                                </p>
                                {depositHash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${depositHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400/60 hover:text-blue-400 mt-2 inline-block"
                                    >
                                        View Deposit TX →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Main Action Button */}
                        <button
                            onClick={handleMainAction}
                            disabled={isButtonDisabled}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {getButtonContent()}
                        </button>

                        {/* Info */}
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <p className="text-xs text-yellow-300">
                                <strong>Note:</strong> First-time deposits require approval. Gas fees apply to both transactions.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </ModalContainer>
    );
}
