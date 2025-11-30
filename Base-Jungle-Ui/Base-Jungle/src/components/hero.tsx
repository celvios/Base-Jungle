import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import { useState, useRef } from "react";
import { useTheme } from "@/contexts/theme-context";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  opacity: number;
}

export function Hero() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const starIdRef = useRef(0);
  const lastParticleTimeRef = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return;

    const now = Date.now();
    // Only create particles every 150ms to avoid constant recreation
    if (now - lastParticleTimeRef.current < 150) return;
    lastParticleTimeRef.current = now;

    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create scattered stars already spread out from start
    const newStars: Star[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const initialDistance = Math.random() * 80 + 20; // Already scattered, not clustered
      const star: Star = {
        id: starIdRef.current++,
        x: x + Math.cos(angle) * initialDistance,
        y: y + Math.sin(angle) * initialDistance,
        size: Math.random() * 2.5 + 1.5,
        duration: Math.random() * 2.5 + 2,
        opacity: 1,
      };
      newStars.push(star);
    }

    setStars((prev) => [...prev, ...newStars].slice(-120)); // Keep max 120 stars

    // Remove stars after animation
    const maxDuration = Math.max(...newStars.map((s) => s.duration));
    setTimeout(() => {
      setStars((prev) => prev.filter((s) => !newStars.find((ns) => ns.id === s.id)));
    }, maxDuration * 1000);
  };

  const starColor = theme === "dark" ? "#ffffff" : "#3b82f6"; // white for dark, blue for light

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-background cursor-crosshair"
      onMouseMove={handleMouseMove}
    >
      {/* Star particles */}
      {stars.map((star) => {
        const angle = Math.random() * Math.PI * 2;
        const finalDistance = Math.random() * 250 + 150;
        return (
          <div
            key={star.id}
            className="pointer-events-none fixed rounded-full"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: starColor,
              borderRadius: "50%",
              animation: `node-scatter ${star.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              boxShadow: `0 0 ${star.size * 3}px ${starColor}`,
              "--scatter-tx": `${Math.cos(angle) * finalDistance}px`,
              "--scatter-ty": `${Math.sin(angle) * finalDistance}px`,
            } as React.CSSProperties & { "--scatter-tx": string; "--scatter-ty": string }}
          />
        );
      })}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-primary" data-testid="text-badge">
                Live on Base Blockchain
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight" data-testid="text-hero-title">
                Base Jungle The Future of{" "}
                <span className="text-primary">DAO Infrastructure</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl" data-testid="text-hero-description">
                Your gateway to DeFi on Base. An innovative infrastructure for governing and
                streamlining DAOs, empowered by the strength of a decentralized community.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2"
                data-testid="button-launch-dapp"
              >
                DAPP
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-background/50 backdrop-blur-sm"
                data-testid="button-github"
              >
                <Github className="w-4 h-4" />
                GITHUB
              </Button>
            </div>

          </div>

          {/* 3D Visualization Space */}
          <div className="relative lg:h-[600px] h-[400px] flex items-center justify-center perspective">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated Circles - Enhanced for light mode */}
              <div className="absolute inset-0 flex items-center justify-center animate-rotate-slow">
                <div className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full border-2 border-primary/40 dark:border-primary/20 shadow-lg shadow-primary/10" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center animate-rotate-reverse">
                <div className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full border-2 border-primary/50 dark:border-primary/30 shadow-md shadow-primary/15" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center animate-rotate-slow-reverse">
                <div className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/60 dark:border-primary/40 shadow-sm shadow-primary/20" />
              </div>

              {/* Central Glow with Pulse */}
              <div className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary via-primary/60 to-primary/30 blur-3xl animate-pulse-glow opacity-70 dark:opacity-100" />

              {/* Center Icon with Float Animation */}
              <div className="absolute z-20 w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-float shadow-xl shadow-primary/40">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
