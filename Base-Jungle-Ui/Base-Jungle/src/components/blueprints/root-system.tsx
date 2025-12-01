import { motion } from "framer-motion";
import { useState } from "react";

interface RootSystemProps {
    strategy: "conservative" | "balanced" | "aggressive";
}

interface Allocation {
    protocol: string;
    percentage: number;
    label: string;
    icon: string;
}

const allocations = {
    conservative: [
        { protocol: "Aave", percentage: 60, label: "Stable Lending (USDC)", icon: "🏦" },
        { protocol: "Aerodrome", percentage: 30, label: "Stable LP (USDC/DAI)", icon: "💧" },
        { protocol: "Lido", percentage: 10, label: "Liquid Staking (stETH)", icon: "⚡" },
    ],
    balanced: [
        { protocol: "Aave", percentage: 40, label: "Lending", icon: "🏦" },
        { protocol: "Uniswap", percentage: 35, label: "LP Farming", icon: "🦄" },
        { protocol: "Moonwell", percentage: 25, label: "Yield Farming", icon: "🌙" },
    ],
    aggressive: [
        { protocol: "Concentrated LP", percentage: 40, label: "High APY Farms", icon: "🎯" },
        { protocol: "Leveraged LP", percentage: 30, label: "3x Leverage", icon: "📈" },
        { protocol: "Delta-Neutral", percentage: 20, label: "Hedged Strategies", icon: "⚖️" },
        { protocol: "Arbitrage", percentage: 10, label: "MEV Capture", icon: "⚡" },
    ],
};

const riskScores = {
    conservative: { score: 0.15, label: "LOW" },
    balanced: { score: 0.45, label: "MEDIUM" },
    aggressive: { score: 0.75, label: "HIGH" },
};

export function RootSystem({ strategy }: RootSystemProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const currentAllocations = allocations[strategy];
    const riskData = riskScores[strategy];

    return (
        <div className="max-w-6xl mx-auto">
            {/* SVG Flow Diagram */}
            <svg
                viewBox="0 0 1200 600"
                className="w-full h-auto"
                style={{ filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))" }}
            >
                {/* User Deposit (Left) */}
                <g>
                    <circle cx="100" cy="300" r="60" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" strokeWidth="2" />
                    <text x="100" y="295" textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="bold">
                        USER
                    </text>
                    <text x="100" y="315" textAnchor="middle" fill="#06b6d4" fontSize="12">
                        DEPOSIT
                    </text>
                </g>

                {/* Roots (Paths) */}
                {currentAllocations.map((allocation, index) => {
                    const yOffset = 150 + index * 120;
                    const thickness = allocation.percentage / 5;
                    const isHovered = hoveredIndex === index;

                    return (
                        <g key={index}>
                            {/* Animated Path */}
                            <motion.path
                                d={`M 160 300 Q 500 ${yOffset} 1040 ${yOffset}`}
                                fill="none"
                                stroke={isHovered ? "#22d3ee" : "#06b6d4"}
                                strokeWidth={thickness}
                                opacity={isHovered ? 1 : 0.6}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: index * 0.3 }}
                            />

                            {/* Animated Pulse */}
                            <motion.circle
                                r="8"
                                fill="#22d3ee"
                                opacity="0.8"
                                initial={{ offsetDistance: "0%" }}
                                animate={{ offsetDistance: "100%" }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: index * 0.5,
                                    ease: "linear",
                                }}
                            >
                                <animateMotion
                                    dur={strategy === "aggressive" ? "2s" : "4s"}
                                    repeatCount="indefinite"
                                    path={`M 160 300 Q 500 ${yOffset} 1040 ${yOffset}`}
                                />
                            </motion.circle>

                            {/* Protocol Destination (Right) */}
                            <g
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: "pointer" }}
                            >
                                <circle
                                    cx="1100"
                                    cy={yOffset}
                                    r="50"
                                    fill={isHovered ? "#06b6d4" : "#0e7490"}
                                    opacity="0.2"
                                    stroke="#06b6d4"
                                    strokeWidth="2"
                                />
                                <text x="1100" y={yOffset - 10} textAnchor="middle" fill="#06b6d4" fontSize="24">
                                    {allocation.icon}
                                </text>
                                <text x="1100" y={yOffset + 10} textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold">
                                    {allocation.protocol}
                                </text>
                                <text x="1100" y={yOffset + 25} textAnchor="middle" fill="#06b6d4" fontSize="10" opacity="0.7">
                                    {allocation.percentage}%
                                </text>
                            </g>

                            {/* Percentage Label on Path */}
                            <text
                                x="600"
                                y={yOffset - 20}
                                textAnchor="middle"
                                fill="#22d3ee"
                                fontSize="16"
                                fontWeight="bold"
                                opacity={isHovered ? 1 : 0.5}
                            >
                                {allocation.percentage}%
                            </text>
                            <text
                                x="600"
                                y={yOffset - 5}
                                textAnchor="middle"
                                fill="#06b6d4"
                                fontSize="11"
                                opacity={isHovered ? 1 : 0.4}
                            >
                                {allocation.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Risk Score Gauge */}
            <motion.div
                className="mt-12 flex items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <div className="text-right">
                    <div className="text-sm text-white/60">RISK SCORE</div>
                    <div className="text-3xl font-bold text-cyan-400">{riskData.score.toFixed(2)}</div>
                </div>

                <div className="w-64 h-4 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${strategy === "conservative"
                                ? "bg-green-500"
                                : strategy === "balanced"
                                    ? "bg-blue-500"
                                    : "bg-red-500"
                            }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${riskData.score * 100}%` }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />
                </div>

                <div className="text-left">
                    <div className="text-sm text-white/60">LEVEL</div>
                    <div className={`text-xl font-bold ${strategy === "conservative"
                            ? "text-green-400"
                            : strategy === "balanced"
                                ? "text-blue-400"
                                : "text-red-400"
                        }`}>
                        {riskData.label}
                    </div>
                </div>
            </motion.div>

            {/* Allocation Details */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAllocations.map((allocation, index) => (
                    <motion.div
                        key={index}
                        className={`p-4 rounded-lg border transition-all ${hoveredIndex === index
                                ? "border-cyan-400 bg-cyan-400/10"
                                : "border-white/10 bg-white/5"
                            }`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{allocation.icon}</span>
                            <div>
                                <div className="font-bold text-cyan-400">{allocation.protocol}</div>
                                <div className="text-xs text-white/60">{allocation.label}</div>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{allocation.percentage}%</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
