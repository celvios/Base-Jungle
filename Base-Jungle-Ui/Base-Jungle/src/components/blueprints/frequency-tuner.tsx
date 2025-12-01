import { motion } from "framer-motion";
import { useState } from "react";

type Strategy = "conservative" | "balanced" | "aggressive";

interface StrategyData {
    targetApy: string;
    riskScore: number;
    leverage: string;
    waveform: string; // SVG path for the waveform
}

const strategyData: Record<Strategy, StrategyData> = {
    conservative: {
        targetApy: "6-8%",
        riskScore: 0.15,
        leverage: "None",
        waveform: "M 0 50 L 200 50", // Flat line
    },
    balanced: {
        targetApy: "10-15%",
        riskScore: 0.45,
        leverage: "2x",
        waveform: "M 0 50 Q 50 30, 100 50 T 200 50", // Gentle waves
    },
    aggressive: {
        targetApy: "20-30%",
        riskScore: 0.75,
        leverage: "3-5x",
        waveform: "M 0 50 L 40 20 L 60 70 L 100 30 L 140 80 L 180 40 L 200 50", // Jagged
    },
};

interface FrequencyTunerProps {
    selectedStrategy: Strategy;
    onStrategyChange: (strategy: Strategy) => void;
}

export function FrequencyTuner({ selectedStrategy, onStrategyChange }: FrequencyTunerProps) {
    const strategies: Strategy[] = ["conservative", "balanced", "aggressive"];
    const currentData = strategyData[selectedStrategy];

    return (
        <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-sm border-b border-[#0052FF]/30">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Strategy Selector */}
                <div className="flex justify-center gap-4 mb-6">
                    {strategies.map((strategy) => {
                        const isActive = selectedStrategy === strategy;
                        const data = strategyData[strategy];

                        return (
                            <motion.button
                                key={strategy}
                                onClick={() => onStrategyChange(strategy)}
                                className={`relative px-8 py-4 rounded-lg border-2 transition-all ${isActive
                                        ? "border-[#0052FF] bg-[#0052FF]/10"
                                        : "border-white/10 bg-white/5 hover:border-[#0052FF]/50"
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Waveform Visualization */}
                                <svg
                                    viewBox="0 0 200 100"
                                    className="w-32 h-12 mb-2"
                                    style={{ filter: isActive ? "drop-shadow(0 0 8px #0052FF)" : "none" }}
                                >
                                    <motion.path
                                        d={data.waveform}
                                        fill="none"
                                        stroke={isActive ? "#0052FF" : "#ffffff40"}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                    />
                                </svg>

                                {/* Label */}
                                <div className="text-center">
                                    <div className={`text-sm font-bold uppercase tracking-wider ${isActive ? "text-[#0052FF]" : "text-white/60"
                                        }`}>
                                        {strategy}
                                    </div>
                                </div>

                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-[#0052FF]"
                                        layoutId="activeIndicator"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Heads-Up Data Strip */}
                <motion.div
                    className="grid grid-cols-3 gap-6 p-4 bg-white/5 rounded-lg border border-[#0052FF]/20"
                    key={selectedStrategy}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Target APY */}
                    <div className="text-center">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Target APY</div>
                        <div className="text-2xl font-bold text-[#0052FF]">{currentData.targetApy}</div>
                    </div>

                    {/* Risk Score */}
                    <div className="text-center">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Risk Score</div>
                        <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-white">{currentData.riskScore.toFixed(2)}</div>
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${selectedStrategy === "conservative"
                                            ? "bg-green-500"
                                            : selectedStrategy === "balanced"
                                                ? "bg-blue-500"
                                                : "bg-red-500"
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentData.riskScore * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Leverage */}
                    <div className="text-center">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Leverage</div>
                        <div className="text-2xl font-bold text-white">{currentData.leverage}</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
