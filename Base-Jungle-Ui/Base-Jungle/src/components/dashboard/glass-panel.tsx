import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glowColor?: "primary" | "green" | "yellow" | "red";
}

export function GlassPanel({ children, className = "", glowColor = "primary" }: GlassPanelProps) {
  const glowColorClass = {
    primary: "from-primary/30 via-primary/10",
    green: "from-green-500/30 via-green-500/10",
    yellow: "from-yellow-500/30 via-yellow-500/10",
    red: "from-red-500/30 via-red-500/10",
  }[glowColor];

  const topAccentClass = {
    primary: "bg-gradient-to-r from-transparent via-primary to-transparent",
    green: "bg-gradient-to-r from-transparent via-green-500 to-transparent",
    yellow: "bg-gradient-to-r from-transparent via-yellow-500 to-transparent",
    red: "bg-gradient-to-r from-transparent via-red-500 to-transparent",
  }[glowColor];

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden bg-card/50 dark:bg-card/30 backdrop-blur-xl border border-card-border/50 dark:border-card-border/30 shadow-lg ${className}`}
    >
      {/* Top accent glow */}
      <div className={`absolute top-0 left-0 right-0 h-px z-0 opacity-30 ${topAccentClass}`} />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      {/* Hover glow effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 bg-gradient-radial ${glowColorClass} to-transparent`}
      />
    </div>
  );
}
