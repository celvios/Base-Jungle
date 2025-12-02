import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useVaultBalance } from "@/hooks/use-vault";
import { usePointsBalance } from "@/hooks/use-points";
import { useReferralData, useDirectReferrals } from "@/hooks/use-referrals";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { useUserRank } from "@/hooks/use-leaderboard";
import { type Address } from "viem";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import ProfileMenu from "@/components/dashboard/ProfileMenu";

// Terminal Components
import TerminalLayout from "@/components/dashboard/terminal/TerminalLayout";
import StatusManifold from "@/components/dashboard/terminal/StatusManifold";
import YieldReactor from "@/components/dashboard/terminal/YieldReactor";
import PressureGauge from "@/components/dashboard/terminal/PressureGauge";
import SignalList from "@/components/dashboard/terminal/SignalList";
import Accumulator from "@/components/dashboard/terminal/Accumulator";

export default function Dashboard() {
  const { isConnected, connect, address } = useWallet();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  // ✅ Real contract data - Vault balances
  const { data: conservativeBalance } = useVaultBalance(
    import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address,
    address as Address
  );

  const { data: aggressiveBalance } = useVaultBalance(
    import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address,
    address as Address
  );

  // ✅ Real contract data - Points
  const { data: pointsData } = usePointsBalance(address as Address);

  // ✅ Real contract data - Referrals
  const { data: referralData } = useReferralData(address as Address);
  const { data: directReferrals } = useDirectReferrals(address as Address);

  // ✅ Real API data - User rank
  const { data: rankData } = useUserRank(address);

  // ✅ Real settings
  const { data: contractSettings } = useUserSettingsContract(address as Address);
  const { isUnlocked: leverageUnlocked } = useLeverageManager(address as Address);

  // Calculate Net Worth
  const netWorth = (
    (conservativeBalance ? Number(conservativeBalance) / 1e6 : 0) +
    (aggressiveBalance ? Number(aggressiveBalance) / 1e6 : 0)
  );

  // Mock Data for Visualization (Replace with real logic later)
  const tier = referralData?.tier || "Novice";
  const depositAmount = netWorth.toFixed(2);
  const nextTierDeposit = "10000"; // Example target
  const depositProgress = Math.min((netWorth / 10000) * 100, 100);

  const referralCount = (referralData?.directCount || 0) + (referralData?.tierTwoCount || 0);
  const nextTierReferrals = 50; // Example target
  const networkProgress = Math.min((referralCount / 50) * 100, 100);

  const chartData = [
    { time: '00:00', value: netWorth * 0.95 },
    { time: '06:00', value: netWorth * 0.97 },
    { time: '12:00', value: netWorth * 0.98 },
    { time: '18:00', value: netWorth * 0.99 },
    { time: '24:00', value: netWorth },
  ];

  const mockReferrals = directReferrals ? directReferrals.map(addr => ({
    address: addr,
    tier: 'Novice',
    status: 'active' as const,
    lastActive: '2h ago'
  })) : [];

  // Show connect wallet modal if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-[#0a0a0a] border border-gray-800 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-900/20 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Access the Liquid Terminal to manage your automated ecosystem.
            </p>
          </div>
          <Button onClick={connect} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden pb-20">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SkeletonCard />
            </div>
            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden pb-20">
      <div className="fixed top-6 right-6 z-50">
        <ProfileMenu />
      </div>

      {/* Header: Status Manifold */}
      <StatusManifold
        tier={tier}
        depositAmount={depositAmount}
        depositProgress={depositProgress}
        nextTierDeposit={nextTierDeposit}
        referralCount={referralCount}
        nextTierReferrals={nextTierReferrals}
        networkProgress={networkProgress}
        totalBalance={netWorth}
        onDeposit={() => console.log('Deposit')}
        onViewReferral={() => window.location.href = '/referrals'}
      />

      <TerminalLayout>
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main Module: Yield Reactor (Chart) - Spans 2 cols */}
          <YieldReactor
            principal={netWorth}
            totalYield={netWorth * 0.15} // Mock lifetime yield
            harvestableYield={netWorth * 0.01} // Mock harvestable
            dailyPnL={1.2}
            data={chartData}
            onHarvest={() => console.log('Harvest')}
          />

          {/* Right Column Stack */}
          <div className="col-span-1 space-y-6 flex flex-col">
            {/* Strategy Module: Pressure Gauge */}
            <PressureGauge
              currentLeverage={1.5}
              maxLeverage={5.0}
              tierLimit={3.0}
              tierName={tier}
              nextTierName="WHALE"
              nextTierRequirement="50 Active Refs"
              healthFactor={1.8}
              liquidationPrice={2800}
              onLeverageChange={(val) => console.log('Leverage:', val)}
            />

            {/* Rewards Module: Accumulator */}
            <Accumulator
              points={pointsData?.balance || 0}
              multiplier={1.25}
              velocity={106.25}
              globalTVL={12450200}
              avgAPY={14.2}
              onViewRewards={() => console.log('View Rewards')}
            />
          </div>

          {/* Bottom Row: Signal List - Spans full width */}
          <SignalList
            referrals={mockReferrals}
            onNudge={(addr) => console.log('Nudge', addr)}
          />

        </div>
      </TerminalLayout>
    </div>
  );
}
