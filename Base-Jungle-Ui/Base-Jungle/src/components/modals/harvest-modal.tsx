import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, ExternalLink, RefreshCw, Lightbulb } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useVaultWithdraw, useVaultBalance, useVaultShareBalance, formatUSDC } from "@/hooks/use-vault";
import { useDepositMaturity, calculateEarlyWithdrawalPenalty } from "@/hooks/use-maturity";
import { useUserPointsContract, formatPoints } from "@/hooks/use-points";
import { useVaultPosition } from "@/hooks/use-vault-position";
import { type Address } from "viem";

interface HarvestModalProps {
  vaultAddress: Address;
  vaultName?: string;
}

type WithdrawalState = "preview" | "processing" | "success";

export function HarvestModal({
  vaultAddress,
  vaultName = "Vault",
}: HarvestModalProps) {
  const { closeModal } = useModal();
  const { address } = useWallet();
  const [slideProgress, setSlideProgress] = useState(0);
  const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>("preview");

  // Get real vault balance and shares
  const { data: vaultBalanceData, isLoading: balanceLoading } = useVaultBalance(vaultAddress, address);
  const { data: shareBalance, isLoading: sharesLoading } = useVaultShareBalance(vaultAddress, address);
  const balance = vaultBalanceData ? Number(formatUSDC(vaultBalanceData)) : 0;
  const shares = shareBalance || 0n;

  // Get maturity info
  const { isMature, daysRemaining, depositTime, isLoading: maturityLoading } = useDepositMaturity(
    vaultAddress,
    address
  );

  // Get bonus points (if user has pending points)
  const { data: pointsData } = useUserPointsContract(address);
  const bonusPoints = pointsData ? Number(formatPoints(pointsData[2])) : 0; // pendingDailyPoints

  // Get real principal/yield from backend (if deposits tracked)
  const { data: vaultPosition } = useVaultPosition(vaultAddress, address, shareBalance, vaultBalanceData);

  // Withdrawal hook
  const { withdraw, isPending, isConfirming, isSuccess, error, hash } = useVaultWithdraw(vaultAddress);

  // Calculate days staked
  const daysStaked = depositTime
    ? Math.floor((Date.now() / 1000 - depositTime) / 86400)
    : 0;

  // Calculate principal and yield
  // Priority:
  // 1. Use tracked data from backend if available
  // 2. Fall back to time-based estimation
  // 3. Fall back to simple ratio if no deposit time

  let estimatedPrincipal: number;
  let estimatedYield: number;

  if (vaultPosition) {
    // Use real tracked data from backend ✅
    estimatedPrincipal = vaultPosition.principal;
    estimatedYield = vaultPosition.yield;
  } else if (depositTime && daysStaked > 0) {
    // Time-based estimation using vault APY
    const vaultAPY = 0.12; // 12% - could be dynamic from use-vault-apy
    const dailyRate = vaultAPY / 365;
    const totalGrowth = 1 + (daysStaked * dailyRate);
    estimatedPrincipal = balance / totalGrowth;
    estimatedYield = balance - estimatedPrincipal;
  } else {
    // Simple ratio fallback
    estimatedPrincipal = balance * 0.95;
    estimatedYield = balance - estimatedPrincipal;
  }

  const totalReturn = balance;

  // Calculate ROI and APY
  const roi = estimatedPrincipal > 0
    ? ((estimatedYield / estimatedPrincipal) * 100).toFixed(2)
    : "0.00";
  const estimatedAPY = estimatedPrincipal > 0 && daysStaked > 0
    ? ((estimatedYield / estimatedPrincipal) * (365 / daysStaked) * 100).toFixed(1)
    : "0.0";

  // Calculate penalty if early withdrawal
  const earlyPenalty = !isMature ? calculateEarlyWithdrawalPenalty(estimatedPrincipal, false) : 0;
  const amountAfterPenalty = isMature ? totalReturn : (estimatedPrincipal - earlyPenalty);

  const handleSlideComplete = async () => {
    if (slideProgress === 100 && address && shares > 0n) {
      setWithdrawalState("processing");

      try {
        // Use actual share balance for withdrawal
        await withdraw(shares.toString(), address, address);
      } catch (err) {
        console.error("Withdrawal failed:", err);
        setWithdrawalState("preview");
        setSlideProgress(0);
      }
    }
  };

  // Update state when transaction confirmed
  useEffect(() => {
    if (isSuccess) {
      setWithdrawalState("success");
      setTimeout(closeModal, 3000);
    }
  }, [isSuccess, closeModal]);

  // Error State
  if (error) {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-400">WITHDRAWAL FAILED</h3>
          <p className="text-blue-300/70 text-center max-w-md">
            {error.message || "Failed to withdraw funds. Please try again."}
          </p>
          <button
            onClick={() => {
              setWithdrawalState("preview");
              setSlideProgress(0);
            }}
            className="px-6 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </ModalContainer>
    );
  }

  // Success State
  if (withdrawalState === "success") {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-green-400">HARVEST COMPLETE</h3>

          <div className="text-center space-y-2">
            <p className="text-blue-300/70">
              ${amountAfterPenalty.toLocaleString()} transferred to your wallet
            </p>
            {hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400/60 font-mono flex items-center gap-2 justify-center hover:text-blue-400 transition-colors"
              >
                View Transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

        </div>
      </ModalContainer>
    );
  }

  // Processing State
  if (withdrawalState === "processing" || isPending || isConfirming) {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
          <h3 className="text-xl font-bold text-blue-300">
            {isPending ? "CONFIRM IN WALLET" : "EXECUTING WITHDRAWAL"}
          </h3>
          <p className="text-blue-300/70 text-center max-w-md">
            {isPending
              ? "Confirm the transaction in your wallet to complete the harvest"
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

  // Loading State
  if (balanceLoading || maturityLoading || sharesLoading) {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-300/70">Loading vault data...</p>
        </div>
      </ModalContainer>
    );
  }

  // No balance
  if (balance === 0) {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <AlertTriangle className="w-16 h-16 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">NO DEPOSITS FOUND</h3>
          <p className="text-blue-300/70 text-center max-w-md">
            You don't have any deposits in this vault yet.
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

  // MATURE STATE - Ready to harvest
  if (isMature) {
    return (
      <ModalContainer onClose={closeModal} title="HARVEST">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-400">MATURE • READY TO HARVEST</span>
            </div>
            <h3 className="text-3xl font-bold text-blue-300 mb-1">
              CYCLE COMPLETE
            </h3>
            <p className="text-blue-300/60">Your capital has fully matured</p>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded border border-blue-500/20 bg-blue-500/5">
            <div>
              <div className="text-xs text-blue-400/60 mb-1">ROI</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="font-mono font-bold text-green-400">+{roi}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-400/60 mb-1">Duration</div>
              <div className="font-mono font-bold text-blue-300">{daysStaked} days</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded border border-blue-500/20 bg-blue-500/5">
              <span className="text-blue-300">Principal</span>
              <span className="font-mono font-bold text-blue-200">${estimatedPrincipal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded border border-green-500/20 bg-green-500/5">
              <span className="text-blue-300">Yield Generated</span>
              <span className="font-mono font-bold text-green-400">
                +${estimatedYield.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 rounded border-2 border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent">
              <span className="text-blue-200 font-medium">Total Return</span>
              <span className="font-mono font-bold text-xl text-blue-300">
                ${totalReturn.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="flex items-center justify-between text-xs text-blue-400/60">
            <span>Network: Base Sepolia</span>
            <span>Estimated APY: {estimatedAPY}%</span>
          </div>

          {/* Slide-to-Claim */}
          <div className="relative mt-8">
            <div className="relative h-14 rounded border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent overflow-hidden">
              <input
                type="range"
                min="0"
                max="100"
                value={slideProgress}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSlideProgress(value);
                  if (value === 100) {
                    handleSlideComplete();
                  }
                }}
                className="absolute inset-0 w-full cursor-pointer opacity-0 z-10"
                disabled={!address}
              />

              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-100"
                style={{ width: `${slideProgress}%` }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white font-bold">
                  {slideProgress < 100 ? "SLIDE TO CLAIM →" : "PROCESSING..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // IMMATURE STATE - Early withdrawal with penalty
  return (
    <ModalContainer onClose={closeModal} title="STABILITY ALERT">
      <div className="space-y-6">
        {/* Warning Header */}
        <div className="text-center animate-glitch">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">IMMATURE WITHDRAWAL</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ECOSYSTEM IMMATURE
          </h3>
          <p className="text-white/70">Early withdrawal penalties apply</p>
        </div>

        {/* Time Remaining */}
        <div className="p-4 rounded border border-yellow-500/30 bg-yellow-500/5 text-center">
          <div className="text-xs text-yellow-400/60 mb-1">TIME UNTIL MATURITY</div>
          <div className="font-mono font-bold text-xl text-yellow-400">
            {daysRemaining} days
          </div>
          <div className="text-xs text-yellow-400/60 mt-1">60-day hold period required for full rewards</div>
        </div>

        {/* Penalty Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded border border-white/20 bg-white/5">
            <span className="text-white/80">Principal (Before Penalty)</span>
            <span className="font-mono font-bold text-white">${estimatedPrincipal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded border border-red-500/20 bg-red-500/5">
            <span className="text-white/80">Early Withdrawal Fee (10%)</span>
            <span className="font-mono font-bold text-red-400">
              -${earlyPenalty.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded border border-red-500/20 bg-red-500/5">
            <span className="text-white/80">Yield Forfeited</span>
            <span className="font-mono font-bold text-red-400">-${estimatedYield.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded border border-red-500/20 bg-red-500/5">
            <span className="text-white/80">Bonus Points Lost</span>
            <span className="font-mono font-bold text-red-400">
              {bonusPoints > 0 ? `${bonusPoints.toFixed(0)} pts` : "ALL (holding bonuses)"}
            </span>
          </div>
          <div className="flex justify-between items-center p-4 rounded border-2 border-white/20 bg-gradient-to-r from-white/5 to-transparent">
            <span className="text-white font-medium">You Will Receive</span>
            <span className="font-mono font-bold text-xl text-white">
              ${amountAfterPenalty.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded border border-blue-500/30 bg-blue-500/5">
          <p className="text-sm text-blue-300/80 text-center">
            <Lightbulb className="w-4 h-4 inline mr-1" /> Wait {daysRemaining} days to avoid ${earlyPenalty.toFixed(2)} penalty and receive full yield of ${estimatedYield.toFixed(2)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-3 border border-blue-500/30 text-blue-300 font-medium rounded hover:bg-blue-500/10 transition-colors"
          >
            Keep Growing
          </button>
          <button
            onClick={async () => {
              if (!address || shares === 0n) return;
              setWithdrawalState("processing");
              try {
                await withdraw(shares.toString(), address, address);
              } catch (err) {
                console.error("Withdrawal failed:", err);
                setWithdrawalState("preview");
              }
            }}
            disabled={isPending || isConfirming || shares === 0n}
            className="px-4 py-3 border-2 border-red-500/50 text-red-400 font-bold rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            Withdraw Anyway
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
