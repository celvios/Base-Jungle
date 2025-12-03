import { GlassPanel } from "@/components/dashboard/glass-panel";
import { Trophy, Medal, Award, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useWallet } from "@/contexts/wallet-context";

const getTierColor = (tier: number) => {
  const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
  const tierName = tierNames[tier] || 'Novice';

  switch (tierName) {
    case "Whale":
      return "text-primary";
    case "Captain":
      return "text-primary/80";
    case "Scout":
      return "text-primary/60";
    default:
      return "text-muted-foreground";
  }
};

const getTierName = (tier: number) => {
  const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
  return tierNames[tier] || 'Novice';
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-primary" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-muted-foreground/70" />;
  return <span className="text-muted-foreground font-mono">#{rank}</span>;
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function LeaderboardPage() {
  const { address: userAddress } = useWallet();
  const { data, isLoading, error } = useLeaderboard(50, 0);

  const leaderboardData = data?.leaderboard || [];

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <GlassPanel className="border-l-4 border-l-red-500">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-red-500">Connection Error</h3>
              </div>
              <p className="text-muted-foreground">
                Unable to connect to the backend API. Please ensure:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Backend server is running on port 3001</li>
                <li>Run <code className="px-1.5 py-0.5 rounded bg-muted">npm run dev</code> in the server directory</li>
                <li>Check server console for any errors</li>
              </ul>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (!leaderboardData.length) {
    return (
      <div className="min-h-screen p-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <GlassPanel className="border-l-4 border-l-primary/50">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">No Data Available</h3>
              </div>
              <p className="text-muted-foreground">
                The leaderboard is empty. This usually means blockchain data hasn't been synced yet.
              </p>
              <div className="mt-4 p-3 bg-muted/30 rounded-md">
                <p className="text-sm font-medium mb-2">To populate the leaderboard:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Open <code className="px-1.5 py-0.5 rounded bg-muted">server/src/services/sync-blockchain.ts</code></li>
                  <li>Add wallet addresses that have interacted with the protocol</li>
                  <li>Run <code className="px-1.5 py-0.5 rounded bg-muted">npm run sync</code> in the server directory</li>
                </ol>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold" data-testid="text-leaderboard-title">
            Leaderboard
          </h1>
        </div>
        <p className="text-muted-foreground text-lg" data-testid="text-leaderboard-description">
          Top {leaderboardData.length} performers ranked by points earned
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboardData.slice(0, 3).map((entry, idx) => (
          <GlassPanel
            key={entry.address}
            className={`${idx === 0 ? "md:order-2" : idx === 1 ? "md:order-1" : "md:order-3"} h-auto`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {getRankIcon(entry.rank)}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Rank {entry.rank}
                </p>
                <code
                  className="text-sm font-mono"
                  data-testid={`text-podium-address-${entry.rank}`}
                >
                  {formatAddress(entry.address)}
                </code>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-primary" data-testid={`text-podium-points-${entry.rank}`}>
                  {entry.points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
              <Badge variant={entry.tier === 3 ? "default" : "secondary"}>
                {getTierName(entry.tier)}
              </Badge>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <GlassPanel>
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
          FULL RANKINGS
        </h3>

        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5 md:col-span-6">Address</div>
            <div className="col-span-3 md:col-span-2 text-right">Points</div>
            <div className="col-span-3 md:col-span-2 text-right">Referrals</div>
            <div className="hidden md:block md:col-span-1 text-right">Tier</div>
          </div>

          {/* Table Rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {leaderboardData.map((entry) => {
              const isCurrentUser = userAddress && entry.address.toLowerCase() === userAddress.toLowerCase();
              const totalRefs = (entry.direct_referrals || 0) + (entry.indirect_referrals || 0);

              return (
                <div
                  key={entry.address}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 hover-elevate rounded-md transition-colors ${isCurrentUser ? 'bg-green-500/10 border border-green-500/30' : ''
                    }`}
                  data-testid={`row-leaderboard-${entry.rank}`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-5 md:col-span-6 flex items-center gap-2">
                    <code className="text-sm font-mono" data-testid={`text-address-${entry.rank}`}>
                      {formatAddress(entry.address)}
                    </code>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50">YOU</Badge>
                    )}
                  </div>
                  <div className="col-span-3 md:col-span-2 flex items-center justify-end">
                    <span className="font-mono font-semibold" data-testid={`text-points-${entry.rank}`}>
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3 text-primary/70" />
                    <span className="font-mono text-sm" data-testid={`text-referrals-${entry.rank}`}>
                      {totalRefs}
                    </span>
                  </div>
                  <div className="hidden md:flex md:col-span-1 items-center justify-end">
                    <span className={`text-xs font-semibold ${getTierColor(entry.tier)}`}>
                      {getTierName(entry.tier)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
