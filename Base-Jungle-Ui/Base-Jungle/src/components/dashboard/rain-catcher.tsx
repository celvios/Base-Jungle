import { useState, useEffect, useRef } from "react";
import { GlassPanel } from "./glass-panel";
import { ArrowDownToLine, Droplets } from "lucide-react";
import { useModal } from "@/contexts/modal-context";
import { useDepositMaturity } from "@/hooks/use-maturity";
import { type Address } from "viem";

interface RainCatcherProps {
  netWorth: number;
  recentHarvest: number;
  isBooting: boolean;
  vaultAddress?: Address; // Vault contract address
  userAddress?: Address; // User wallet address
}

export function RainCatcher({ netWorth, recentHarvest, isBooting, vaultAddress, userAddress }: RainCatcherProps) {
  const { openModal } = useModal();
  const [displayValue, setDisplayValue] = useState(0);
  const [droplets, setDroplets] = useState<{ id: number; x: number }[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Check deposit maturity status
  const maturityInfo = useDepositMaturity(vaultAddress, userAddress);

  // Animate number counting up during boot
  useEffect(() => {
    if (!isBooting) {
      setDisplayValue(netWorth);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const increment = netWorth / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, netWorth);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(netWorth);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [netWorth, isBooting]);

  // Generate rain droplets when yield is harvested
  useEffect(() => {
    if (recentHarvest > 0 && !isBooting) {
      const newDroplets = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: 20 + Math.random() * 60,
      }));
      setDroplets(newDroplets);

      setTimeout(() => {
        const newRipples = newDroplets.map(d => ({
          id: d.id + 1000,
          x: d.x,
        }));
        setRipples(newRipples);
        setDroplets([]);
        setTimeout(() => setRipples([]), 1500);
      }, 1500);
    }
  }, [recentHarvest, isBooting]);

  const handleHoverStart = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleHoverEnd = () => {
    hideTimeoutRef.current = setTimeout(() => setIsHovered(false), 500);
  };

  const handleWithdrawClick = () => {
    // ✅ Pass real maturity data to harvest modal
    openModal('harvest', {
      vaultAddress: vaultAddress,
    });
  };

  const handleDepositClick = () => {
    openModal('deposit', {
      vaultAddress: vaultAddress,
    });
  };

  // Liquid fill height - min 25% so it's always visible
  const maxTVL = 50000;
  const fillPercentage = Math.max(25, Math.min((netWorth / maxTVL) * 100, 90));

  return (
    <div
      className="relative"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <GlassPanel className="h-[400px] lg:h-[450px]">
        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-primary/70 tracking-wider">
            RAIN CATCHER
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Total Value Locked</p>
        </div>

        {/* Glass Tank */}
        <div className="relative h-[280px] lg:h-[320px] mx-2 rounded-xl border-2 border-white/20 dark:border-white/10 overflow-hidden bg-black/20">

          {/* The Liquid - Bioluminescent Base Blue (#0052FF) */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${fillPercentage}%`,
              background: 'linear-gradient(to top, #0052FF 0%, rgba(0, 82, 255, 0.8) 50%, rgba(0, 82, 255, 0.6) 100%)',
            }}
          >
            {/* Bioluminescent glow effect */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                boxShadow: 'inset 0 0 60px rgba(0, 82, 255, 0.8), 0 0 40px rgba(0, 82, 255, 0.4)',
              }}
            />

            {/* Gentle surface waves - calms on hover */}
            <div className={`absolute -top-1 left-0 right-0 h-6 transition-all duration-500 ${isHovered ? 'opacity-20' : 'opacity-100'}`}>
              <svg className="w-full h-full" viewBox="0 0 400 24" preserveAspectRatio="none">
                <path
                  d="M0,12 Q100,6 200,12 T400,12 L400,24 L0,24 Z"
                  fill="#0052FF"
                  className={isHovered ? '' : 'animate-wave'}
                />
                <path
                  d="M0,14 Q80,8 160,14 T320,14 T400,14 L400,24 L0,24 Z"
                  fill="rgba(0, 82, 255, 0.7)"
                  className={isHovered ? '' : 'animate-wave'}
                  style={{ animationDelay: '0.5s' }}
                />
              </svg>
            </div>

            {/* Ripples from droplet impacts */}
            {ripples.map((ripple) => (
              <div
                key={ripple.id}
                className="absolute top-0 w-12 h-3 rounded-full border-2 border-white/60 animate-ping"
                style={{ left: `${ripple.x}%`, transform: 'translateX(-50%)' }}
              />
            ))}

            {/* SUBMERGED Action Buttons */}
            {isHovered && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20 animate-fade-in px-4">
                <button
                  onClick={handleDepositClick}
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 hover:scale-110 flex items-center gap-2 flex-1 max-w-[180px]"
                  style={{
                    backgroundColor: 'rgba(0, 200, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(0, 255, 0, 0.5)',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    boxShadow: '0 4px 20px rgba(0, 255, 0, 0.3)',
                  }}
                  data-testid="button-deposit"
                >
                  <Droplets className="w-5 h-5" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={handleWithdrawClick}
                  disabled={netWorth === 0}
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 hover:scale-110 flex items-center gap-2 flex-1 max-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    boxShadow: '0 4px 20px rgba(0, 82, 255, 0.3)',
                  }}
                  data-testid="button-withdraw"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  <span>Withdraw</span>
                </button>
              </div>
            )}
          </div>

          {/* Droplets falling from top */}
          {droplets.map((droplet) => (
            <div
              key={droplet.id}
              className="absolute top-0 w-2 h-8 rounded-full animate-droplet"
              style={{
                left: `${droplet.x}%`,
                background: 'linear-gradient(to bottom, #0052FF, rgba(0, 82, 255, 0.3))',
                boxShadow: '0 0 10px #0052FF',
              }}
            />
          ))}

          {/* Giant numbers floating inside */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4">
            <div className="text-center w-full">
              <div
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light font-mono tracking-tight text-white dark:text-white truncate drop-shadow-lg"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0, 82, 255, 0.6)' }}
                data-testid="text-net-worth"
              >
                ${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {recentHarvest > 0 && !isBooting && (
                <div className="mt-2 text-green-300 dark:text-green-400 font-mono animate-pulse text-base font-semibold drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                  +${recentHarvest.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Tank measurement lines */}
          <div className="absolute inset-y-0 right-3 flex flex-col justify-between py-6 pointer-events-none">
            {[100, 75, 50, 25, 0].map((level) => (
              <div key={level} className="flex items-center gap-1">
                <div className="w-4 h-px bg-white/50 dark:bg-white/30" />
                <span className="text-[10px] text-white/80 dark:text-white/40 font-mono font-medium drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{level}%</span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
