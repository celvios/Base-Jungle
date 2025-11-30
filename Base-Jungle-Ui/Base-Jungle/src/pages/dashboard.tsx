import { useState, useEffect } from "react";
import { RainCatcher } from "@/components/dashboard/rain-catcher";
import { Sonar } from "@/components/dashboard/sonar";
import { Vine } from "@/components/dashboard/vine";
import { BiomassCapacitor } from "@/components/dashboard/biomass-capacitor";
import { StrategyBreakers } from "@/components/dashboard/strategy-breakers";
import { Atmosphere } from "@/components/dashboard/atmosphere";
import { WalletProfile } from "@/components/wallet-profile";
import { Trophy, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { useVaultBalance } from "@/hooks/use-vault";
import { usePointsBalance } from "@/hooks/use-points";
import { useReferralData } from "@/hooks/use-referrals";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { useUserRank } from "@/hooks/use-leaderboard";
import { type Address } from "viem";

export default function Dashboard() {
  const [isBooting, setIsBooting] = useState(true);
  const [stormMode, setStormMode] = useState(false);
  const { isConnected, connect, address } = useWallet();

  // ✅ Real contract data - Vault balances
  const { data: conservativeBalance, isLoading: loadingConservative } = useVaultBalance(
    import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address,
    address as Address
  );

  const { data: aggressiveBalance, isLoading: loadingAggressive } = useVaultBalance(
    import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address,
    address as Address
  );

  // ✅ Real contract data - Points
  const { data: pointsData, isLoading: loadingPoints } = usePointsBalance(address as Address);

  // ✅ Real contract data - Referrals
  const { data: referralData, isLoading: loadingReferrals } = useReferralData(address as Address);

  // ✅ Real API data - User rank from backend
  const { data: rankData } = useUserRank(address);

  const isLoadingData = loadingConservative || loadingAggressive || loadingPoints || loadingReferrals;

  useEffect(() => {
    // Boot sequence
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
    }, 3000);

    return () => clearTimeout(bootTimer);
  }, []);

  // Show connect wallet modal if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50" />
        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the Command Center and manage your DeFi positions.
            </p>
          </div>
          <Button
            onClick={connect}
            size="lg"
            className="w-full"
            data-testid="button-connect-wallet-modal"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Calculate real data from contracts
  const netWorth = (
    (conservativeBalance ? Number(conservativeBalance) / 1e6 : 0) +
    (aggressiveBalance ? Number(aggressiveBalance) / 1e6 : 0)
  );

  // Calculate weighted average APY (simplified - TODO: get actual APY from contracts)
  const conservativeAPY = 12.5; // Conservative vault typical APY
  const aggressiveAPY = 18.5;   // Aggressive vault typical APY
  const conservativeValue = conservativeBalance ? Number(conservativeBalance) / 1e6 : 0;
  const aggressiveValue = aggressiveBalance ? Number(aggressiveBalance) / 1e6 : 0;

  const totalValue = conservativeValue + aggressiveValue;
  const averageAPY = totalValue > 0
    ? ((conservativeValue * conservativeAPY) + (aggressiveValue * aggressiveAPY)) / totalValue
    : conservativeAPY; // Default to conservative if no deposits

  // ✅ Get real settings from contracts
  const { data: contractSettings } = useUserSettingsContract(address as Address);
  const { isActive: leverageIsActive, currentMultiplier, isUnlocked: leverageUnlocked } = useLeverageManager(address as Address);

  // Map contract risk level (0, 1, 2) to display value
  const getRiskLevel = () => {
    const riskValue = contractSettings?.[1];
    if (riskValue === undefined) return "medium";
    if (riskValue === 0) return "low";
    if (riskValue === 1) return "medium";
    return "high";
  };

  const userData = {
    // Real blockchain data
    netWorth,
    totalPoints: pointsData?.balance || 0,
    rank: referralData?.tier || "Novice",
    dailyPointRate: pointsData?.dailyRate || 0,
    referrals: {
      direct: referralData?.directCount || 0,
      indirect: referralData?.tierTwoCount || 0,
      total: (referralData?.directCount || 0) + (referralData?.tierTwoCount || 0),
      nextTierRequired: 5, // TODO: Get from contract
    },
    // Real settings from contracts
    autoCompound: contractSettings?.[0] || true,
    riskLevel: getRiskLevel() as "low" | "medium" | "high",
    leverageUnlocked: leverageUnlocked || false,
    tier: referralData?.tier || "Novice",
    // Real APY data
    marketHealth: averageAPY,
    recentHarvest: 0, // TODO: Calculate from events
    leaderboardRank: rankData?.rank || 999, // Real rank from API
    totalParticipants: rankData?.total_users || 500, // Real count from API
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">

      {/* Digital Rain Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="digital-rain" />
      </div>

      {/* Storm Mode Effect */}
      {stormMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="storm-lightning" />
        </div>
      )}

      {/* Main Dashboard Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 pt-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-foreground mb-2">Command Center</h1>
            <div className="h-0.5 w-24 bg-gradient-to-r from-primary/60 to-transparent" />
          </div>

          {/* Profile & Leaderboard Rank */}
          <div className="flex items-center gap-3">
            {/* Leaderboard Rank */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-leaderboard-rank">
                #{userData.leaderboardRank}
              </span>
            </div>

            {/* Wallet Profile - only icon, no connect button */}
            <WalletProfile showConnectButton={false} />
          </div>
        </div>

        {/* Bento Grid - Desktop: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-fr">
          {/* Column 1: The Self - Left Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Biomass Capacitor (Points) - Top Left 1x1 */}
            <BiomassCapacitor
              totalPoints={userData.totalPoints}
              rank={userData.rank}
              dailyPointRate={userData.dailyPointRate}
              isBooting={isBooting || isLoadingData}
            />

            {/* Vine (Referral Tree) - Left Sidebar Tall 1x3 */}
            <Vine
              directRefs={userData.referrals.direct}
              indirectRefs={userData.referrals.indirect}
              nextTierRequired={userData.referrals.nextTierRequired}
              currentTier={userData.tier}
              isBooting={isBooting || isLoadingData}
            />
          </div>

          {/* Column 2: The Assets - Center */}
          <div className="lg:col-span-6 space-y-4">
            {/* Rain Catcher (Net Worth) - Center Large 2x2 */}
            <RainCatcher
              netWorth={userData.netWorth}
              recentHarvest={userData.recentHarvest}
              isBooting={isBooting || isLoadingData}
              vaultAddress={
                userData.riskLevel === 'low'
                  ? (import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address)
                  : (import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address)
              }
              userAddress={address as Address}
            />

            {/* Strategy Breakers (Controls) - Bottom Center Wide 2x1 */}
            <StrategyBreakers
              autoCompound={userData.autoCompound}
              riskLevel={userData.riskLevel}
              leverageUnlocked={userData.leverageUnlocked}
              tier={userData.tier}
              isBooting={isBooting}
            />
          </div>

          {/* Column 3: The Ecosystem - Right Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sonar (Bot Feed) - Top Right 1x1 */}
            <Sonar isBooting={isBooting} />

            {/* Atmosphere (Market Health) - Bottom Right 1x1 */}
            <Atmosphere
              marketHealth={userData.marketHealth}
              isBooting={isBooting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
