import { motion } from "framer-motion";
import { useState } from "react";
import { Shield, Gauge, Split } from "lucide-react";

interface Hotspot {
    id: string;
    title: string;
    description: string;
    icon: typeof Shield;
    x: number;
    y: number;
}

const hotspots: Hotspot[] = [
    {
        id: "slippage",
        title: "Slippage Guard",
        description: "Hardcoded limit: 0.5% max slippage on all swaps. Prevents value loss during rebalancing.",
        icon: Shield,
        x: 300,
        y: 150,
    },
    {
        id: "health",
        title: "Health Monitor",
        description: "Auto-repay triggers if Health Factor < 1.4. Continuous monitoring prevents liquidation.",
        icon: Gauge,
        x: 600,
        y: 200,
    },
    {
        id: "diversification",
        title: "Diversification",
        description: "Max 30% allocation to any single protocol. Reduces concentration risk.",
        icon: Split,
        x: 450,
        y: 350,
    },
];

export function SafetyValve() {
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="relative">
                {/* SVG Pressure Vessel Schematic */}
                <svg viewBox="0 0 800 500" className="w-full h-auto">
                    {/* Main vessel body */}
                    <rect
                        x="250"
                        y="100"
                        width="300"
                        height="300"
                        rx="20"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        opacity="0.6"
                    />

                    {/* Pressure lines */}
                    <line x1="250" y1="150" x2="550" y2="150" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />
                    <line x1="250" y1="250" x2="550" y2="250" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />
                    <line x1="250" y1="350" x2="550" y2="350" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />

                    {/* Input pipe (left) */}
                    <rect x="150" y="235" width="100" height="30" fill="#0e7490" stroke="#06b6d4" strokeWidth="2" />
                    <polygon points="140,250 150,235 150,265" fill="#06b6d4" />

                    {/* Output pipe (right) */}
                    <rect x="550" y="235" width="100" height="30" fill="#0e7490" stroke="#06b6d4" strokeWidth="2" />
                    <polygon points="660,250 650,235 650,265" fill="#06b6d4" />

                    {/* Hotspot markers */}
                    {hotspots.map((hotspot, index) => {
                        const Icon = hotspot.icon;
                        const isActive = activeHotspot === hotspot.id;

                        return (
                            <g
                                key={hotspot.id}
                                onMouseEnter={() => setActiveHotspot(hotspot.id)}
                                onMouseLeave={() => setActiveHotspot(null)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Pulsing circle */}
                                <motion.circle
                                    cx={hotspot.x}
                                    cy={hotspot.y}
                                    r={isActive ? 35 : 25}
                                    fill={isActive ? "#06b6d4" : "#0e7490"}
                                    opacity="0.3"
                                    animate={{
                                        scale: isActive ? [1, 1.1, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: isActive ? Infinity : 0,
                                    }}
                                />
                                <circle
                                    cx={hotspot.x}
                                    cy={hotspot.y}
                                    r="25"
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="2"
                                />

                                {/* Icon placeholder (using text for now) */}
                                <text
                                    x={hotspot.x}
                                    y={hotspot.y + 5}
                                    textAnchor="middle"
                                    fill="#06b6d4"
                                    fontSize="20"
                                    fontWeight="bold"
                                >
                                    {index + 1}
                                </text>

                                {/* Connector line to description */}
                                {isActive && (
                                    <line
                                        x1={hotspot.x}
                                        y1={hotspot.y}
                                        x2={hotspot.x > 400 ? 700 : 100}
                                        y2={50 + index * 80}
                                        stroke="#06b6d4"
                                        strokeWidth="1"
                                        strokeDasharray="4 2"
                                        opacity="0.5"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Center label */}
                    <text x="400" y="260" textAnchor="middle" fill="#06b6d4" fontSize="24" fontWeight="bold" opacity="0.5">
                        SAFETY SYSTEM
                    </text>
                </svg>

                {/* Hotspot descriptions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hotspots.map((hotspot, index) => {
                        const Icon = hotspot.icon;
                        const isActive = activeHotspot === hotspot.id;

                        return (
                            <motion.div
                                key={hotspot.id}
                                className={`p-6 rounded-lg border transition-all ${isActive
                                        ? "border-cyan-400 bg-cyan-400/10 scale-105"
                                        : "border-white/10 bg-white/5"
                                    }`}
                                onMouseEnter={() => setActiveHotspot(hotspot.id)}
                                onMouseLeave={() => setActiveHotspot(null)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h3 className="font-bold text-cyan-400">{hotspot.title}</h3>
                                </div>
                                <p className="text-sm text-white/70">{hotspot.description}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-white/5 rounded-lg border border-cyan-400/30">
                        <div className="text-3xl font-bold text-cyan-400">99.9%</div>
                        <div className="text-sm text-white/60 mt-2">Uptime</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-lg border border-cyan-400/30">
                        <div className="text-3xl font-bold text-cyan-400">0</div>
                        <div className="text-sm text-white/60 mt-2">Liquidations</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-lg border border-cyan-400/30">
                        <div className="text-3xl font-bold text-cyan-400">24/7</div>
                        <div className="text-sm text-white/60 mt-2">Monitoring</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
