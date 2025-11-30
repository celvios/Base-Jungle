import { useEffect, useState } from "react";
import { GlassPanel } from "./glass-panel";
import { Zap } from "lucide-react";

interface BiomassCapacitorProps {
  totalPoints: number;
  rank: string;
  dailyPointRate: number;
  isBooting: boolean;
}

export function BiomassCapacitor({
  totalPoints,
  rank,
  dailyPointRate,
  isBooting,
}: BiomassCapacitorProps) {
  const [pulseSpeed, setPulseSpeed] = useState(2000);

  // Calculate pulse speed based on daily rate
  useEffect(() => {
    if (dailyPointRate < 50) {
      setPulseSpeed(2000); // Slow
    } else if (dailyPointRate < 200) {
      setPulseSpeed(1000); // Medium
    } else {
      setPulseSpeed(500); // Fast strobe
    }
  }, [dailyPointRate]);

  // Calculate fill percentage (maxPoints at 20000)
  const fillPercentage = Math.min((totalPoints / 20000) * 100, 100);

  return (
    <GlassPanel className="h-[200px]">
      <div className="flex items-center gap-6 h-full">
        {/* Vertical Battery Vial */}
        <div className="relative w-16 h-full flex-shrink-0">
          <div className="absolute inset-0 rounded-xl border border-primary/30 bg-muted/20 overflow-hidden">
            {/* Fill */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary via-primary/80 to-primary/60 transition-all duration-1000"
              style={{
                height: `${fillPercentage}%`,
                animation: `pulse-glow ${pulseSpeed}ms ease-in-out infinite`,
              }}
            />

            {/* Horizontal markers */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute left-0 right-0 border-t border-primary/20"
                style={{ top: `${100 - mark}%` }}
              />
            ))}

            {/* Glow effect */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary/50 blur-xl pointer-events-none transition-all duration-1000"
              style={{
                height: `${fillPercentage}%`,
                animation: `pulse-glow ${pulseSpeed}ms ease-in-out infinite`,
              }}
            />
          </div>

          {/* Top cap with icon */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary/20 rounded-full border border-primary/50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-3">
            BIOMASS
          </h3>

          <div className="space-y-3">
            {/* Total Points */}
            <div>
              <div className="text-xs text-muted-foreground">Total Energy</div>
              <div className="text-2xl font-mono font-bold text-foreground">
                {totalPoints.toLocaleString()}
                <span className="text-sm text-primary ml-1">pts</span>
              </div>
            </div>

            {/* Rank */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Rank</div>
                <div className="text-sm font-bold text-primary">{rank}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rate</div>
                <div className="text-sm font-mono font-bold text-green-500 dark:text-green-400">
                  +{dailyPointRate}/day
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
