import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useVaultBalance } from "@/hooks/use-vault";
import { usePointsBalance } from "@/hooks/use-points";
import { useReferralData } from "@/hooks/use-referrals";
import { useUserSettingsContract } from "@/hooks/use-settings";
import { useLeverageManager } from "@/hooks/use-leverage";
import { useUserRank } from "@/hooks/use-leaderboard";
import { type Address } from "viem";

// New Crystal Components
import CrystalLayout from "@/components/dashboard/crystal/CrystalLayout";
import CoreReactor from "@/components/dashboard/crystal/CoreReactor";
import HolographicRadar from "@/components/dashboard/crystal/HolographicRadar";
import CrystalFormation from "@/components/dashboard/crystal/CrystalFormation";
import CapacitorBank from "@/components/dashboard/crystal/CapacitorBank";
import ControlDeck from "@/components/dashboard/crystal/ControlDeck";
import DashboardMobile from "@/components/dashboard/crystal/DashboardMobile";

export default function Dashboard() {
  const { isConnected, connect, address } = useWallet();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Map risk level
  const getRiskLevel = () => {
    const riskValue = contractSettings?.[1];
    if (riskValue === undefined) return "medium";
    if (riskValue === 0) return "low";
    if (riskValue === 1) return "medium";
    return "high";
  };

  const userData = {
    netWorth,
    totalPoints: pointsData?.balance || 0,
    dailyPointRate: pointsData?.dailyRate || 0,
    referrals: {
      direct: referralData?.directCount || 0,
      indirect: referralData?.tierTwoCount || 0,
      total: (referralData?.directCount || 0) + (referralData?.tierTwoCount || 0),
    },
    autoCompound: contractSettings?.[0] || true,
    riskLevel: getRiskLevel() as "low" | "medium" | "high",
    leverageUnlocked: leverageUnlocked || false,
    tier: referralData?.tier || "Novice",
    leaderboardRank: rankData?.rank || 999,
  };

  // Mock Logs for Radar
  const mockLogs = [
    "Scanning for yield opportunities...",
    "Detected 12% APY on Aerodrome",
    "Rebalance Check: Optimal",
    "Health Factor: 1.8 (Safe)",
    "Harvesting pending rewards..."
  ];

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
              Access the Crystal Cockpit to manage your automated ecosystem.
            </p>
          </div>
          <Button onClick={connect} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return <DashboardMobile userData={userData} />;
  }

  // Desktop 3D View
  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden">
      <CrystalLayout>
        {/* Center: Core Reactor */}
        <CoreReactor netWorth={userData.netWorth} tvl={12450000} />

        {/* Right: Radar */}
        <HolographicRadar logs={mockLogs} />

        {/* Left: Crystal Formation (Referrals) */}
        <CrystalFormation referrals={userData.referrals} tier={userData.tier} />

        {/* Left Top: Capacitor Bank (Points) */}
        <CapacitorBank points={userData.totalPoints} dailyRate={userData.dailyPointRate} />
      </CrystalLayout>

      {/* Bottom: Control Deck */}
      <ControlDeck
        autoCompound={userData.autoCompound}
        riskLevel={userData.riskLevel}
        onToggleAutoCompound={() => { }} // TODO: Hook up to contract write
        onChangeRisk={() => { }} // TODO: Hook up to contract write
      />
    </div>
  );
}
