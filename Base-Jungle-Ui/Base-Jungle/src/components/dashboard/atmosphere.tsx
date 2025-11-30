import { useMemo } from "react";
import { GlassPanel } from "./glass-panel";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface AtmosphereProps {
  marketHealth: number; // Real APY from vaults
  isBooting: boolean;
  vaultName?: string;
}

export function Atmosphere({ marketHealth, isBooting, vaultName = "Conservative Vault" }: AtmosphereProps) {
  // Generate seismograph data
  const seismographData = useMemo(() => {
    const points = [];
    const volatility = marketHealth > 20 ? 5 : marketHealth < 15 ? 15 : 10;

    for (let i = 0; i < 100; i++) {
      const baseValue = 50;
      const noise = (Math.random() - 0.5) * volatility;
      const trend = (i / 100) * (marketHealth - 18.5) * 2; // Slight trend based on market
      points.push(baseValue + noise + trend);
    }
    return points;
  }, [marketHealth]);

  const getMarketState = () => {
    if (marketHealth >= 15) return { label: "EXCELLENT", color: "text-green-400", icon: TrendingUp };
    if (marketHealth >= 10) return { label: "HEALTHY", color: "text-blue-400", icon: Activity };
    if (marketHealth >= 5) return { label: "MODERATE", color: "text-yellow-400", icon: Activity };
    return { label: "LOW", color: "text-orange-400", icon: TrendingDown };
  };

  const state = getMarketState();
  const Icon = state.icon;

  return (
    <GlassPanel className="h-[280px]">
      <div className="flex flex-col h-full">
        {/* Title */}
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
          ATMOSPHERE
        </h3>

        {/* Market State */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${state.color}`} />
            <span className={`text-sm font-bold ${state.color}`}>{state.label}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Base APY</div>
            <div className="text-xl font-mono font-bold text-foreground">
              {marketHealth.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Seismograph */}
        <div className="flex-1 relative">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.1)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Seismograph line */}
            <polyline
              points={seismographData
                .map((y, x) => `${x},${y}`)
                .join(" ")}
              fill="none"
              stroke={
                marketHealth >= 20
                  ? "hsl(var(--primary))"
                  : marketHealth >= 15
                    ? "hsl(var(--foreground))"
                    : "hsl(0 72% 45%)"
              }
              strokeWidth="2"
              className={marketHealth < 15 ? "animate-glitch-line" : ""}
            />

            {/* Glow effect */}
            <polyline
              points={seismographData
                .map((y, x) => `${x},${y}`)
                .join(" ")}
              fill="none"
              stroke={
                marketHealth >= 20
                  ? "hsl(var(--primary) / 0.3)"
                  : marketHealth >= 15
                    ? "hsl(var(--foreground) / 0.3)"
                    : "hsl(0 72% 45% / 0.3)"
              }
              strokeWidth="6"
              filter="blur(2px)"
            />
          </svg>

          {/* Moving scan line */}
          <div className="absolute inset-0">
            <div className="h-full w-0.5 bg-primary/50 animate-scan-right" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-xs text-muted-foreground">
          {vaultName} APY Monitor
        </div>
      </div>
    </GlassPanel>
  );
}
