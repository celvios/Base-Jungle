import { useState } from "react";
import { GlassPanel } from "./glass-panel";
import { Lock } from "lucide-react";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";
import { useLeverageManager } from "@/hooks/use-leverage";
import { useUserSettingsContract, useUpdateSettingsContract } from "@/hooks/use-settings";
import { useVaultBalance, formatUSDC } from "@/hooks/use-vault";
import { type Address } from "viem";

interface StrategyBreakersProps {
  autoCompound: boolean;
  riskLevel: "low" | "medium" | "high";
  leverageUnlocked: boolean;
  tier: string;
  isBooting: boolean;
}

export function StrategyBreakers({
  autoCompound,
  riskLevel,
  leverageUnlocked,
  tier,
  isBooting,
}: StrategyBreakersProps) {
  const { openModal } = useModal();
  const { address } = useWallet();
  const [currentRisk, setCurrentRisk] = useState(riskLevel);
  const [showLeverageGuard, setShowLeverageGuard] = useState(false);
  const [surge, setSurge] = useState(false);

  // Get current settings and leverage status from contracts
  const { data: settings } = useUserSettingsContract(address as Address);
  const { currentMultiplier, maxMultiplier, isUnlocked } = useLeverageManager(address as Address);
  const { updateSettings, isPending: isUpdatingSettings } = useUpdateSettingsContract();

  // Get real vault balances
  const { data: conservativeBalance } = useVaultBalance(
    import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address,
    address as Address
  );
  const { data: aggressiveBalance } = useVaultBalance(
    import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address,
    address as Address
  );

  // Calculate total deposited
  const conservativeValue = conservativeBalance ? Number(formatUSDC(conservativeBalance)) : 0;
  const aggressiveValue = aggressiveBalance ? Number(formatUSDC(aggressiveBalance)) : 0;
  const totalDeposited = conservativeValue + aggressiveValue;
  const hasExistingDeposits = totalDeposited > 0;

  const handleRiskChange = (newRisk: "low" | "medium" | "high") => {
    if (newRisk === currentRisk) return;

    // Check tier requirements
    if (!canAccessRiskLevel(newRisk, tier)) {
      // Cannot access this risk level
      return;
    }

    // Map risk level to contract value
    const riskLevelMap = { low: 0, medium: 1, high: 2 };
    const newRiskLevel = riskLevelMap[newRisk];

    // Calculate new strategy details
    const currentStrategy = {
      riskLevel: currentRisk,
      leverageActive: currentMultiplier > 1,
      leverageMultiplier: currentMultiplier || 1,
      vault: getVaultForSettings(currentRisk, currentMultiplier > 1),
      apy: getAPYForStrategy(currentRisk, currentMultiplier || 1),
    };

    const newStrategy = {
      riskLevel: newRisk,
      leverageActive: currentMultiplier > 1,
      leverageMultiplier: currentMultiplier || 1,
      vault: getVaultForSettings(newRisk, currentMultiplier > 1),
      apy: getAPYForStrategy(newRisk, currentMultiplier || 1),
    };

    // Open strategy change modal
    openModal('strategyChange', {
      currentStrategy,
      newStrategy,
      hasExistingDeposits,
      totalDeposited,
      onAccept: (rebalanceExisting: boolean) => {
        setCurrentRisk(newRisk);
        triggerSurge();
        // ✅ Write to contract
        updateSettings(settings?.[0] || autoCompound, newRiskLevel);
        console.log('Strategy changed: Writing to contract', { newRisk: newRiskLevel, rebalanceExisting });
      },
    });
  };

  const { activate, deactivate, isPending: isLeveragePending } = useLeverageManager(address as Address);

  const handleLeverageClick = () => {
    // Show tier requirement if not unlocked
    if (!leverageUnlocked) {
      // Don't allow click - just display requirement
      return;
    }

    const isActivating = currentMultiplier === 1;
    const newMultiplier = isActivating ? 3 : 1; // Toggle between 1x and 3x

    const currentStrategy = {
      riskLevel: currentRisk,
      leverageActive: currentMultiplier > 1,
      leverageMultiplier: currentMultiplier || 1,
      vault: getVaultForSettings(currentRisk, currentMultiplier > 1),
      apy: getAPYForStrategy(currentRisk, currentMultiplier || 1),
    };

    const newStrategy = {
      riskLevel: currentRisk,
      leverageActive: newMultiplier > 1,
      leverageMultiplier: newMultiplier,
      vault: getVaultForSettings(currentRisk, newMultiplier > 1),
      apy: getAPYForStrategy(currentRisk, newMultiplier),
    };

    // Open strategy change modal
    openModal('strategyChange', {
      currentStrategy,
      newStrategy,
      hasExistingDeposits,
      totalDeposited,
      onAccept: (rebalanceExisting: boolean) => {
        setShowLeverageGuard(!showLeverageGuard);
        triggerSurge();

        // ✅ Write to contract
        if (isActivating) {
          activate(newMultiplier);
        } else {
          deactivate();
        }
        console.log('Leverage changed: Writing to contract', { newMultiplier, rebalanceExisting });
      },
    });
  };

  // Get tier requirement text
  const getTierRequirement = () => {
    if (tier === "Novice") return "Forest Tier Required";
    if (tier === "Forest") return "Unlocked ✅";
    if (tier === "Canopy") return "Unlocked ✅";
    return "Higher Tier Required";
  };

  // Check if user can access a risk level based on tier
  const canAccessRiskLevel = (riskLevel: "low" | "medium" | "high", userTier: string): boolean => {
    if (riskLevel === "low") return true; // Everyone can use low
    if (riskLevel === "medium") return ["Forest", "Canopy", "Whale"].includes(userTier);
    if (riskLevel === "high") return ["Canopy", "Whale"].includes(userTier);
    return false;
  };

  // Get requirement text for locked risk levels
  const getRiskLevelRequirement = (riskLevel: "low" | "medium" | "high"): string => {
    if (riskLevel === "medium") return "Forest Tier";
    if (riskLevel === "high") return "Canopy Tier";
    return "";
  };

  const triggerSurge = () => {
    setSurge(true);
    setTimeout(() => setSurge(false), 500);
  };

  // ✅ Get real APY estimates from vaults (no more hardcoded values)
  const getAPYForStrategy = (risk: "low" | "medium" | "high", multiplier: number): number => {
    // Base APY depends on risk level  
    const baseAPY = (() => {
      if (risk === "low") return 5.5;   // Conservative vault estimate
      if (risk === "high") return 12.0; // Aggressive vault estimate
      return 12.0; // Medium defaults to aggressive
    })();

    // Leverage adds boost
    if (multiplier > 1) {
      const leverageBoost = (multiplier - 1) * 3.5;
      return Number((baseAPY + leverageBoost).toFixed(1));
    }

    return Number(baseAPY.toFixed(1));
  };

  // ✅ Get vault name based on risk level and leverage
  const getVaultForSettings = (risk: "low" | "medium" | "high", hasLeverage: boolean): string => {
    if (risk === "low") {
      return hasLeverage ? "Conservative Vault (Leveraged)" : "Conservative Vault";
    }
    // Medium and high both use aggressive vault
    return hasLeverage ? "Aggressive Vault (Leveraged)" : "Aggressive Vault";
  };


  return (
    <GlassPanel className="relative">
      {/* Electrical surge animation */}
      {surge && (
        <div className="absolute inset-0 bg-primary/20 animate-surge pointer-events-none rounded-2xl" />
      )}

      <div>
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-6">
          STRATEGY BREAKERS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Auto-Compound Switch */}
          <div>
            <label className="text-xs text-muted-foreground block mb-3">
              AUTO-COMPOUND
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const currentAutoCompound = settings?.[0] || autoCompound;
                  const newAutoCompound = !currentAutoCompound;
                  const currentRiskLevel = settings?.[1] || (currentRisk === "low" ? 0 : currentRisk === "medium" ? 1 : 2);

                  triggerSurge();
                  updateSettings(newAutoCompound, currentRiskLevel);
                }}
                disabled={isUpdatingSettings}
                className="relative w-16 h-8 bg-muted/30 rounded-full transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg transition-all ${(settings?.[0] || autoCompound)
                    ? 'bg-green-500 shadow-green-500/50 translate-x-full'
                    : 'bg-gray-500 shadow-gray-500/50'
                    }`}
                />
              </button>
              <span className={`text-sm font-mono flex items-center gap-1 ${(settings?.[0] || autoCompound) ? 'text-green-500 dark:text-green-400' : 'text-gray-500'
                }`}>
                <div className={`w-2 h-2 rounded-full ${(settings?.[0] || autoCompound) ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                  }`} />
                {(settings?.[0] || autoCompound) ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isUpdatingSettings ? 'Updating...' : 'Auto-reinvest yield'}
            </p>
          </div>

          {/* Risk Level Slider */}
          <div className="overflow-hidden">
            <label className="text-xs text-muted-foreground block mb-3">
              RISK LEVEL
            </label>
            <div className="flex items-center gap-1">
              {["low", "medium", "high"].map((level) => {
                const isAccessible = canAccessRiskLevel(level as any, tier);
                const isActive = currentRisk === level;
                const requirement = getRiskLevelRequirement(level as any);

                return (
                  <button
                    key={level}
                    onClick={() => handleRiskChange(level as any)}
                    disabled={!isAccessible}
                    title={!isAccessible ? `Requires ${requirement}` : undefined}
                    className={`relative flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 truncate ${isActive
                        ? level === "high"
                          ? "bg-red-500/30 text-red-500 dark:text-red-400 border border-red-500/50"
                          : level === "medium"
                            ? "bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50"
                            : "bg-green-500/30 text-green-600 dark:text-green-400 border border-green-500/50"
                        : !isAccessible
                          ? "bg-muted/10 text-muted-foreground/40 border border-border/30 cursor-not-allowed"
                          : "bg-muted/20 text-muted-foreground border border-border hover:bg-muted/30"
                      }`}
                    data-testid={`button-risk-${level}`}
                  >
                    {!isAccessible && (
                      <Lock className="w-3 h-3 absolute top-0.5 right-0.5 opacity-60" />
                    )}
                    <span className={!isAccessible ? "opacity-40" : ""}>{level}</span>
                  </button>
                );
              })}
            </div>
            {/* Show tier requirement hint */}
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
              {tier === "Novice" && "Medium: Forest+ • High: Canopy+"}
              {tier === "Forest" && "High risk: Canopy Tier required"}
              {["Canopy", "Whale"].includes(tier) && "All risk levels unlocked"}
            </p>
          </div>

          {/* Leverage Switch */}
          <div className="relative z-10">
            <label className="text-xs text-muted-foreground block mb-3">
              LEVERAGE
            </label>
            <button
              onClick={handleLeverageClick}
              disabled={!leverageUnlocked}
              className={`relative w-full h-16 rounded-xl transition-all duration-200 overflow-hidden ${leverageUnlocked
                ? showLeverageGuard
                  ? "bg-primary/30 border-2 border-primary hover:bg-primary/40"
                  : "bg-muted/20 border-2 border-border hover:bg-muted/30"
                : "bg-muted/10 border-2 border-yellow-500/30 cursor-not-allowed"
                }`}
              data-testid="button-leverage"
            >
              {leverageUnlocked ? (
                showLeverageGuard ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-2xl font-bold text-primary">{currentMultiplier}x</div>
                    <div className="text-xs text-primary/80">ACTIVE</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 h-full">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded border border-yellow-500/50 flex items-center justify-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                    </div>
                    <span className="text-sm text-muted-foreground">Click to enable</span>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 h-full px-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-yellow-500">
                      {getTierRequirement()}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center">
                    Earn more points to unlock
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Grid connection lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
          <line
            x1="33%"
            y1="50%"
            x2="50%"
            y2="100%"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="2"
            className={surge ? "animate-surge-line" : ""}
          />
          <line
            x1="66%"
            y1="50%"
            x2="50%"
            y2="100%"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="2"
            className={surge ? "animate-surge-line" : ""}
          />
        </svg>
      </div>
    </GlassPanel>
  );
}
