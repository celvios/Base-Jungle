import React from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { useReferralData } from '@/hooks/use-referrals';
import { type Address } from 'viem';
import CrystalLayout from '@/components/dashboard/crystal/CrystalLayout';
import MycelialNetwork from '@/components/referrals/MycelialNetwork';
import SporeGenerator from '@/components/referrals/SporeGenerator';
import SpecimenLeaderboard from '@/components/referrals/SpecimenLeaderboard';
import HarvestStation from '@/components/referrals/HarvestStation';

const ReferralsPage: React.FC = () => {
  const { address } = useWallet();
  const { data: referralData } = useReferralData(address as Address);

  // Mock data for now until hook is fully populated
  const directCount = referralData?.directCount || 0;
  const indirectCount = referralData?.tierTwoCount || 0;
  const referralCode = address ? address.slice(2, 8).toUpperCase() : "CONNECT";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  const pendingRewards = 450; // Mock
  const totalRewards = 12500; // Mock

  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden">
      {/* Background: Interactive Mycelial Network */}
      <MycelialNetwork directCount={directCount} indirectCount={indirectCount} />

      {/* Foreground UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">

        {/* Header */}
        <div className="pointer-events-auto">
          <h1 className="text-4xl font-bold text-white font-mono tracking-tighter mb-2">THE EXPEDITION</h1>
          <p className="text-gray-400 font-mono max-w-md">
            Expand the colony. Your genetic sequence propagates through the ecosystem, earning you yield from every spore you plant.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pointer-events-auto">

          {/* Left: Spore Generator */}
          <div className="space-y-6">
            <SporeGenerator referralCode={referralCode} referralLink={referralLink} />
          </div>

          {/* Center: Empty (View of the Tree) */}
          <div className="hidden md:block" />

          {/* Right: Leaderboard & Harvest */}
          <div className="space-y-6 flex flex-col items-end">
            <HarvestStation
              pendingRewards={pendingRewards}
              totalRewards={totalRewards}
              onClaim={() => console.log("Claiming...")}
            />
            <SpecimenLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
