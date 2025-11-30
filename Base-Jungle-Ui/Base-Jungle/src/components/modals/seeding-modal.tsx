import { useState } from "react";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import { ModalContainer } from "./modal-container";
import { useModal } from "@/contexts/modal-context";

type TransactionState = "input" | "approval" | "deposit" | "success";

export function SeedingModal() {
  const { closeModal } = useModal();
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<TransactionState>("input");
  const [selectedVault, setSelectedVault] = useState("master-vault-1");
  
  // Mock data - would come from blockchain in production
  const userBalance = 5000;
  const vaultAPY = 18.5;
  const estimatedGas = 0.12;
  const maxAmount = 100000;
  
  const numAmount = parseFloat(amount) || 0;
  const percentage = (numAmount / maxAmount) * 100;
  
  const getLiquidColor = () => {
    if (percentage < 33) return "bg-blue-400";
    if (percentage < 66) return "bg-blue-500";
    return "bg-blue-600";
  };

  const getProjection = () => {
    if (percentage < 25) return "Small";
    if (percentage < 50) return "Medium";
    if (percentage < 75) return "Large";
    return "Massive";
  };

  const getEstimatedYield = () => {
    return (numAmount * vaultAPY) / 365 / 100;
  };

  const handleMaxClick = () => {
    setAmount(userBalance.toString());
  };

  const handleApprove = () => {
    setTxState("approval");
    // Simulate blockchain approval
    setTimeout(() => {
      setTxState("deposit");
    }, 2000);
  };

  const handleDeposit = () => {
    setTxState("deposit");
    // Simulate blockchain deposit
    setTimeout(() => {
      setTxState("success");
      setTimeout(closeModal, 2000);
    }, 2000);
  };

  const isValidAmount = numAmount > 0 && numAmount <= userBalance;
  const needsApproval = txState === "input";

  // Success State
  if (txState === "success") {
    return (
      <ModalContainer onClose={closeModal} title="SEEDING CONSOLE">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-400">GERMINATION INITIATED</h3>
          <p className="text-blue-300/70 text-center">
            Your ${numAmount.toLocaleString()} has been successfully seeded
          </p>
          <div className="text-sm text-blue-400/60 font-mono">
            Tx: 0xAbC...123
          </div>
        </div>
      </ModalContainer>
    );
  }

  // Approval/Deposit Loading States
  if (txState === "approval" || txState === "deposit") {
    return (
      <ModalContainer onClose={closeModal} title="SEEDING CONSOLE">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <h3 className="text-xl font-bold text-blue-300">
            {txState === "approval" ? "APPROVING TOKEN ACCESS" : "EXECUTING DEPOSIT"}
          </h3>
          <p className="text-blue-300/70 text-center max-w-md">
            {txState === "approval" 
              ? "Confirm the approval transaction in your wallet to allow the vault to access your USDC"
              : "Confirm the deposit transaction in your wallet to complete the seeding process"
            }
          </p>
          <div className="text-sm text-blue-400/60">
            Step {txState === "approval" ? "1" : "2"} of 2
          </div>
        </div>
      </ModalContainer>
    );
  }

  // Input State
  return (
    <ModalContainer onClose={closeModal} title="SEEDING CONSOLE">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* Left: Input Section */}
        <div className="space-y-6">
          {/* Vault Selector */}
          <div>
            <label className="text-sm text-blue-300 block mb-2">
              SELECT VAULT
            </label>
            <div className="relative">
              <select
                value={selectedVault}
                onChange={(e) => setSelectedVault(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium appearance-none cursor-pointer hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                data-testid="select-vault"
              >
                <option value="master-vault-1">Master Vault #1 - {vaultAPY}% APY</option>
                <option value="master-vault-2">Master Vault #2 - 15.2% APY</option>
                <option value="master-vault-3">Master Vault #3 - 22.8% APY</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-blue-300">DEPOSIT AMOUNT</label>
              <div className="text-xs text-blue-400/60 font-mono">
                Balance: ${userBalance.toLocaleString()}
              </div>
            </div>
            
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-20 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all duration-200"
                data-testid="input-deposit-amount"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-bold rounded-lg transition-all duration-200 hover:scale-105"
                data-testid="button-max"
              >
                MAX
              </button>
            </div>

            {numAmount > userBalance && (
              <p className="text-red-400 text-xs mt-1">Insufficient balance</p>
            )}
          </div>

          {/* Visual Liquid Gauge */}
          <div className="relative h-32 bg-gradient-to-b from-white/5 to-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div
              className={`absolute bottom-0 left-0 right-0 ${getLiquidColor()} transition-all duration-300 opacity-40`}
              style={{ height: `${Math.min(percentage, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-blue-300">
                  ${numAmount.toLocaleString()}
                </div>
                <div className="text-xs text-blue-400/60">
                  {getProjection()} Canopy
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-gray-400 text-xs mb-1">APY</div>
              <div className="font-mono font-bold text-white">{vaultAPY}%</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-gray-400 text-xs mb-1">Daily Yield</div>
              <div className="font-mono font-bold text-green-400">
                ${getEstimatedYield().toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-gray-400 text-xs mb-1">Gas Est.</div>
              <div className="font-mono font-bold text-white">${estimatedGas}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-gray-400 text-xs mb-1">Points/Day</div>
              <div className="font-mono font-bold text-blue-400">
                {Math.floor((numAmount / maxAmount) * 250)} pts
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview & Action */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Visual Preview */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent backdrop-blur-xl flex items-center justify-center overflow-hidden">
                <svg
                  className="w-24 h-24 animate-pulse"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    filter: `brightness(${0.5 + percentage / 200})`,
                  }}
                >
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="15"
                    ry="25"
                    stroke="#0052FF"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="30"
                    r="8"
                    stroke="#0052FF"
                    strokeWidth="2"
                    fill="none"
                  />
                  <line
                    x1="50"
                    y1="55"
                    x2="50"
                    y2="75"
                    stroke="#0052FF"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div
                className="absolute inset-0 rounded-lg bg-blue-500/20 blur-2xl pointer-events-none -z-10"
                style={{ opacity: Math.min(percentage / 100, 0.8) }}
              />
            </div>
            <p className="text-blue-300 font-medium mt-4">
              {percentage < 50 ? "The Seedling" : "The Sapling"}
            </p>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-4 rounded-2xl bg-blue-500/10 backdrop-blur-xl">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300/70">
              This requires 2 transactions: token approval and deposit. Gas fees apply to both.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={needsApproval ? handleApprove : handleDeposit}
            disabled={!isValidAmount}
            className={`w-full px-6 py-4 font-semibold rounded-2xl transition-all duration-200 ${
              isValidAmount
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
            data-testid="button-initiate-germination"
          >
            {needsApproval ? "APPROVE & SEED" : "CONFIRM DEPOSIT"}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
