import React from 'react';
import { useWallet } from '@/contexts/wallet-context';
import { useReferralData, useDirectReferrals } from '@/hooks/use-referrals';
import { usePointsBalance } from '@/hooks/use-points';
import { type Address } from 'viem';
import SporeGenerator from '@/components/referrals/SporeGenerator';
import SpecimenLeaderboard from '@/components/referrals/SpecimenLeaderboard';
import HarvestStation from '@/components/referrals/HarvestStation';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const ReferralsPage: React.FC = () => {
  const { address } = useWallet();
  const { data: referralData, isLoading } = useReferralData(address as Address);
  const { data: directReferrals } = useDirectReferrals(address as Address);

  // ✅ Real points data from contract
  const { data: pointsData } = usePointsBalance(address as Address);
  const totalRewards = pointsData?.balance || 0;
  const pendingRewards = pointsData?.pending || 0;

  const directCount = referralData?.directCount || 0;
  const indirectCount = referralData?.tierTwoCount || 0;
  const referralCode = address ? address.slice(2, 8).toUpperCase() : "CONNECT";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const referralsList = directReferrals || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white font-mono tracking-tighter mb-2">THE EXPEDITION</h1>
        <p className="text-gray-400 font-mono max-w-md">
          Expand the colony. Your genetic sequence propagates through the ecosystem, earning you yield from every spore you plant.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Spore Generator */}
        <div>
          <SporeGenerator referralCode={referralCode} referralLink={referralLink} />
        </div>

        {/* Center: Referrals List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-white">Your Referrals ({referralsList.length})</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {referralsList.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No referrals yet. Share your link to get started!</p>
              ) : (
                referralsList.map((referralAddress, index) => (
                  <div key={index} className="bg-black/30 border border-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Referral #{index + 1}</p>
                    <p className="text-sm font-mono text-white truncate">{referralAddress}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Harvest & Leaderboard */}
        <div className="space-y-6">
          <HarvestStation
            pendingRewards={pendingRewards}
            totalRewards={totalRewards}
            onClaim={() => console.log("Claiming...")}
          />
          <SpecimenLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
