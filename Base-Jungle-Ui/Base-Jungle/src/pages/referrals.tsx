import { ReferralTiers } from "@/components/referral-tiers";
import { GlassPanel } from "@/components/dashboard/glass-panel";
import { Button } from "@/components/ui/button";
import { Copy, Users, TrendingUp, Award, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useReferralManager, useReferralCounts, usePendingBonus, useUserTier } from "@/hooks/use-referrals";
import { type Address } from "viem";

export default function ReferralsPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { address } = useWallet();

  // ✅ Real contract data
  const { data: counts } = useReferralCounts(address as Address);
  const { data: tier } = useUserTier(address as Address);
  const { data: pendingBonus } = usePendingBonus(address as Address);

  // Calculate referral data from contracts
  const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
  const tierRequirements = [5, 15, 50, 0]; // Requirements for each tier

  const currentTierIndex = tier !== undefined ? tier : 0;
  const currentTier = tierNames[currentTierIndex];
  const nextTierIndex = Math.min(currentTierIndex + 1, 3);
  const nextTier = tierNames[nextTierIndex];
  const nextTierRequirement = tierRequirements[currentTierIndex];

  const directReferrals = counts ? Number(counts[0]) : 0;
  const indirectReferrals = counts ? Number(counts[1]) : 0;
  const totalReferrals = directReferrals + indirectReferrals;
  const bonusPoints = pendingBonus ? Number(pendingBonus) / 1e18 : 0;

  // Generate referral code from address (simplified - in production use backend API)
  const referralCode = address ? `${address.slice(2, 8).toUpperCase()}` : "CONNECT";
  const referralLink = `https://basejungle.xyz/ref/${referralCode}`;

  const progress = nextTierRequirement > 0 ? (directReferrals / nextTierRequirement) * 100 : 100;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold" data-testid="text-referrals-title">
          Referral Program
        </h1>
        <p className="text-muted-foreground text-lg" data-testid="text-referrals-description">
          Grow your network, unlock higher tiers, and maximize your rewards
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Referrals */}
        <GlassPanel className="h-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Referrals
              </p>
              <p className="text-2xl font-bold font-mono" data-testid="text-total-referrals">
                {totalReferrals}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Active Referrals */}
        <GlassPanel className="h-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Active Referrals
              </p>
              <p className="text-2xl font-bold font-mono" data-testid="text-active-referrals">
                {directReferrals}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Current Tier */}
        <GlassPanel className="h-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Current Tier
              </p>
              <p className="text-2xl font-bold" data-testid="text-current-tier">
                {currentTier}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Points Earned */}
        <GlassPanel className="h-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Bonus Points
              </p>
              <p className="text-2xl font-bold font-mono" data-testid="text-bonus-points">
                +{Math.floor(bonusPoints).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Referral Link Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Share Link */}
        <GlassPanel>
          <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
            YOUR REFERRAL LINK
          </h3>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted/30 rounded-md border border-border/50 font-mono text-sm truncate" data-testid="text-referral-link">
              {referralLink}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Share this link to invite users and earn rewards
          </p>
        </GlassPanel>

        {/* Progress to Next Tier */}
        <GlassPanel>
          <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
            PROGRESS TO {nextTier.toUpperCase()}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Referrals</span>
              <span className="font-mono" data-testid="text-progress-referrals">
                {directReferrals} / {nextTierRequirement > 0 ? nextTierRequirement : 'MAX'}
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
                data-testid="progress-bar-tier"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {nextTierRequirement > 0
                ? `${nextTierRequirement - directReferrals} more direct referrals to unlock ${nextTier} tier`
                : `You've reached the maximum tier!`
              }
            </p>
          </div>
        </GlassPanel>
      </div>

      {/* Referral Code Section */}
      <GlassPanel>
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
          REFERRAL CODE
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-3 flex-1">
            <LinkIcon className="w-5 h-5 text-primary" />
            <code className="text-2xl font-bold font-mono tracking-wider" data-testid="text-referral-code">
              {referralCode}
            </code>
          </div>
          <Button
            variant="outline"
            onClick={handleCopyCode}
            data-testid="button-copy-code"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Code
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Users can enter this code during signup to be linked to your referral network
        </p>
      </GlassPanel>

      {/* Tier Overview */}
      <ReferralTiers />
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
