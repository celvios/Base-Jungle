import { GlassPanel } from "./glass-panel";
import { Lock } from "lucide-react";

interface VineProps {
  directRefs: number;
  indirectRefs: number;
  nextTierRequired: number;
  isBooting: boolean;
  currentTier?: string;
}

// Tier requirements based on ReferralManager contract
const getTierRequirement = (currentTier: string = "Novice") => {
  const requirements: Record<string, number> = {
    "Novice": 5,    // Need 5 direct refs for Scout
    "Scout": 15,    // Need 15 direct refs for Captain
    "Captain": 50,  // Need 50 direct refs for Whale
    "Whale": 0,     // Max tier
  };
  return requirements[currentTier] || 5;
};

export function Vine({ directRefs, indirectRefs, nextTierRequired, isBooting, currentTier = "Novice" }: VineProps) {
  const actualRequirement = getTierRequirement(currentTier);
  const progress = (directRefs / actualRequirement) * 100;
  const isLocked = directRefs < actualRequirement;

  return (
    <GlassPanel className="h-[500px]">
      <div className="flex flex-col h-full">
        {/* Title */}
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
          THE VINE
        </h3>

        {/* Tree Visualization */}
        <div className="flex-1 relative flex items-end justify-center pb-8">
          <svg
            className="w-full h-full"
            viewBox="0 0 200 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main stem */}
            <path
              d="M 100 400 Q 100 300 100 200 Q 100 100 100 50"
              stroke={directRefs > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
              strokeWidth="4"
              fill="none"
              className={directRefs > 0 ? "animate-pulse" : ""}
            />

            {/* Level 1 branches (direct refs) */}
            {directRefs >= 1 && (
              <>
                <path
                  d="M 100 300 Q 80 280 60 260"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  className="animate-grow-branch"
                />
                <circle cx="60" cy="260" r="4" fill="hsl(var(--primary))" className="animate-pulse" />
              </>
            )}
            {directRefs >= 2 && (
              <>
                <path
                  d="M 100 300 Q 120 280 140 260"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  className="animate-grow-branch"
                />
                <circle cx="140" cy="260" r="4" fill="hsl(var(--primary))" className="animate-pulse" />
              </>
            )}
            {directRefs >= 3 && (
              <>
                <path
                  d="M 100 200 Q 75 180 50 160"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  className="animate-grow-branch"
                />
                <circle cx="50" cy="160" r="4" fill="hsl(var(--primary))" className="animate-pulse" />
              </>
            )}

            {/* Level 2 branches (indirect refs) */}
            {indirectRefs > 0 && directRefs >= 1 && (
              <>
                <path
                  d="M 60 260 Q 50 245 40 230"
                  stroke="hsl(var(--primary) / 0.6)"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="40" cy="230" r="2" fill="hsl(var(--primary) / 0.6)" />
              </>
            )}
            {indirectRefs > 3 && directRefs >= 2 && (
              <>
                <path
                  d="M 140 260 Q 150 245 160 230"
                  stroke="hsl(var(--primary) / 0.6)"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="160" cy="230" r="2" fill="hsl(var(--primary) / 0.6)" />
              </>
            )}

            {/* Locked fruit at top */}
            <g transform="translate(100, 30)">
              {isLocked ? (
                <>
                  <circle cx="0" cy="0" r="12" fill="hsl(var(--muted) / 0.1)" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="2" />
                  <Lock className="w-4 h-4 text-muted-foreground" x="-8" y="-8" />
                </>
              ) : (
                <>
                  <circle cx="0" cy="0" r="12" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="2" className="animate-pulse" />
                  <text x="0" y="5" textAnchor="middle" fill="hsl(var(--primary))" fontSize="16">
                    3x
                  </text>
                </>
              )}
            </g>

            {/* Seed at bottom */}
            <ellipse
              cx="100"
              cy="390"
              rx="8"
              ry="12"
              fill={directRefs > 0 ? "hsl(var(--primary) / 0.5)" : "hsl(var(--muted) / 0.5)"}
              stroke={directRefs > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Progress Section */}
        <div className="mt-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress to Next Tier</span>
              <span>{directRefs}/{actualRequirement}</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isLocked ? "bg-primary/50" : "bg-primary"
                  }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Direct</div>
              <div className="font-mono font-bold text-foreground">{directRefs}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Indirect</div>
              <div className="font-mono font-bold text-primary">{indirectRefs}</div>
            </div>
          </div>

          {/* Locked Message */}
          {isLocked && currentTier !== "Whale" && (
            <div className="mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400/80">
                {actualRequirement - directRefs} more referrals to unlock next tier
              </p>
            </div>
          )}
          {currentTier === "Whale" && (
            <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400/80">
                🎉 Max tier achieved! You've unlocked all benefits.
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
