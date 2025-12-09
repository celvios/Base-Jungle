import { useState, useEffect } from "react";
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

export function DepositModal() {
    const { closeModal } = useModal();
    const { address } = useWallet();
    const [amount, setAmount] = useState("");
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

    // Get minimum deposit for this user
    const { data: minDepositRaw } = useVaultMinimumDeposit(targetVault.address, address);
    const minDeposit = minDepositRaw ? Number(formatUSDC(minDepositRaw)) : 0;

    // Check current allowance
    const { data: currentAllowance, refetch: refetchAllowance } = useUSDCAllowance(address, targetVault.address);
    const hasEnoughAllowance = currentAllowance ? currentAllowance >= parsedAmount : false;

    // APPROVAL transaction
    const { 
        writeContract: writeApprove, 
        data: approveHash, 
        isPending: isApprovePending,
        error: approveError,
        reset: resetApprove
    } = useWriteContract();

    const { 
        isLoading: isApproveConfirming, 
        isSuccess: isApproveSuccess 
    } = useWaitForTransactionReceipt({ hash: approveHash });

    // DEPOSIT transaction
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
    } = useWaitForTransactionReceipt({ hash: depositHash });

    // Refetch allowance when approval succeeds
    useEffect(() => {
        if (isApproveSuccess) {
            console.log("✅ Approval successful, refetching allowance...");
            refetchAllowance();
        }
    }, [isApproveSuccess, refetchAllowance]);

    // Close modal on deposit success
    useEffect(() => {
        if (isDepositSuccess) {
            console.log("🎉 Deposit successful!");
            setTimeout(() => closeModal(), 2000);
        }
    }, [isDepositSuccess, closeModal]);

    // Handle errors
    useEffect(() => {
        if (approveError) {
            console.error("Approve error:", approveError);
            setError(approveError.message || "Approval failed");
            resetApprove();
        }
    }, [approveError, resetApprove]);

    useEffect(() => {
        if (depositError) {
            console.error("Deposit error:", depositError);
            setError(depositError.message || "Deposit failed");
            resetDeposit();
        }
    }, [depositError, resetDeposit]);

    // APPROVE button click
    const handleApprove = () => {
        if (!address || !targetVault.address) return;
        
        console.log("🔵 Approving USDC for vault:", targetVault.address);
        setError(null);
        
        const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        
        writeApprove({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [targetVault.address, maxAmount],
        });
    };

    // DEPOSIT button click
    const handleDeposit = () => {
        if (!address || !targetVault.address || numAmount <= 0) return;
        
        console.log("🟣 Depositing to vault:", targetVault.address);
        console.log("🟣 Amount:", parsedAmount.toString());
        setError(null);
        
        writeDeposit({
            address: targetVault.address,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [parsedAmount, address],
        });
    };

    // Validation
    const isValidAmount = numAmount > 0 && numAmount <= balance && numAmount >= minDeposit;
    const isApproving = isApprovePending || isApproveConfirming;
    const isDepositing = isDepositPending || isDepositConfirming;

    const getEstimatedYield = () => {
        return ((numAmount * targetVault.apy) / 100 / 365).toFixed(2);
    };

    // Success state
    if (isDepositSuccess) {
        return (
            <ModalContainer onClose={closeModal} title="DEPOSIT FUNDS">
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
            </ModalContainer>
        );
    }

    return (
        <ModalContainer onClose={closeModal} title="DEPOSIT FUNDS">
            <div className="space-y-6">
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
                            disabled={isApproving || isDepositing}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-gray-400 text-sm">{getTokenDisplayName('USDC')}</span>
                            <button
                                onClick={() => { setAmount(balance.toString()); setError(null); }}
                                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-400 font-bold transition-colors"
                                disabled={isApproving || isDepositing}
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

                {/* Approval Status */}
                {isApproveSuccess && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400 font-medium">
                                Approval confirmed! Now click "Deposit" below.
                            </span>
                        </div>
                    </div>
                )}

                {/* TWO BUTTONS: Step 1 - Approve, Step 2 - Deposit */}
                <div className="space-y-3">
                    {/* Step 1: Approve Button - Only show if not approved */}
                    {!hasEnoughAllowance && !isApproveSuccess && (
                        <button
                            onClick={handleApprove}
                            disabled={!isValidAmount || isApproving || !address}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isApprovePending ? "Confirm in wallet..." : "Approving..."}
                                </>
                            ) : (
                                <>
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs mr-2">Step 1</span>
                                    Approve {getTokenDisplayName('USDC')}
                                </>
                            )}
                        </button>
                    )}

                    {/* Step 2: Deposit Button - Always show but disabled until approved */}
                    <button
                        onClick={handleDeposit}
                        disabled={!isValidAmount || isDepositing || !address || (!hasEnoughAllowance && !isApproveSuccess)}
                        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isDepositing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isDepositPending ? "Confirm in wallet..." : "Depositing..."}
                            </>
                        ) : (
                            <>
                                {!hasEnoughAllowance && !isApproveSuccess && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs mr-2">Step 2</span>
                                )}
                                <Plus className="w-5 h-5" />
                                Deposit {numAmount > 0 ? `$${numAmount.toLocaleString()}` : ""}
                            </>
                        )}
                    </button>
                </div>

                {/* Transaction Links */}
                <div className="flex justify-center gap-4 text-xs">
                    {approveHash && (
                        <a
                            href={`https://sepolia.basescan.org/tx/${approveHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400/60 hover:text-blue-400"
                        >
                            Approval TX →
                        </a>
                    )}
                    {depositHash && (
                        <a
                            href={`https://sepolia.basescan.org/tx/${depositHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400/60 hover:text-blue-400"
                        >
                            Deposit TX →
                        </a>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-300">
                        <strong>Two-step process:</strong> First approve, then deposit. 
                        If already approved, you can deposit directly.
                    </p>
                </div>
            </div>
        </ModalContainer>
    );
}
