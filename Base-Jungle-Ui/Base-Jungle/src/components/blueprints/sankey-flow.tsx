import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Strategy = "conservative" | "balanced" | "aggressive";

interface Protocol {
    id: string;
    name: string;
    percentage: number;
    description: string;
    apy: string;
    icon: string;
}

const protocolData: Record<Strategy, Protocol[]> = {
    conservative: [
        { id: "aave", name: "Aave", percentage: 60, description: "Stable Lending (USDC)", apy: "6.2%", icon: "🏦" },
        { id: "aerodrome", name: "Aerodrome", percentage: 30, description: "Stable LP (USDC/DAI)", apy: "7.5%", icon: "💧" },
        { id: "lido", name: "Lido", percentage: 10, description: "Liquid Staking (stETH)", apy: "4.8%", icon: "⚡" },
    ],
    balanced: [
        { id: "aave", name: "Aave", percentage: 40, description: "Lending", apy: "8.5%", icon: "🏦" },
        { id: "uniswap", name: "Uniswap", percentage: 35, description: "LP Farming", apy: "12.3%", icon: "🦄" },
        { id: "moonwell", name: "Moonwell", percentage: 25, description: "Yield Farming", apy: "14.7%", icon: "🌙" },
    ],
    aggressive: [
        { id: "beefy", name: "Beefy", percentage: 40, description: "Concentrated Farms", apy: "25.4%", icon: "🎯" },
        { id: "leverage", name: "Leverage Loop", percentage: 30, description: "3x Leverage", apy: "22.8%", icon: "📈" },
        { id: "delta", name: "Delta-Neutral", percentage: 20, description: "Hedged Strategies", apy: "18.5%", icon: "⚖️" },
        { id: "buffer", name: "Stable Buffer", percentage: 10, description: "Safety Reserve", apy: "6.0%", icon: "🛡️" },
    ],
};

interface SankeyFlowProps {
    strategy: Strategy;
}

export function SankeyFlow({ strategy }: SankeyFlowProps) {
    const [hoveredStream, setHoveredStream] = useState<string | null>(null);
    const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
    const protocols = protocolData[strategy];

    return (
        <div className="relative max-w-7xl mx-auto">
            {/* Main SVG Flow */}
            <svg
                viewBox="0 0 1200 600"
                className="w-full h-auto"
                style={{ filter: "drop-shadow(0 0 20px rgba(0, 82, 255, 0.3))" }}
            >
                {/* User Deposit Node (Left) */}
                <g>
                    <rect
                        x="50"
                        y="250"
                        width="120"
                        height="100"
                        rx="8"
                        fill="none"
                        stroke="#0052FF"
                        strokeWidth="2"
                    />
                    <text x="110" y="290" textAnchor="middle" fill="#0052FF" fontSize="14" fontWeight="bold">
                        USER
                    </text>
                    <text x="110" y="310" textAnchor="middle" fill="#0052FF" fontSize="12">
                        DEPOSIT
                    </text>
                    <text x="110" y="330" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold">
                        $100
                    </text>
                </g>

                {/* Flow Streams */}
                {protocols.map((protocol, index) => {
                    const yStart = 300;
                    const yEnd = 150 + index * 120;
                    const thickness = protocol.percentage / 3;
                    const isHovered = hoveredStream === protocol.id;
                    const isDimmed = hoveredStream && hoveredStream !== protocol.id;

                    return (
                        <g
                            key={protocol.id}
                            onMouseEnter={() => setHoveredStream(protocol.id)}
                            onMouseLeave={() => setHoveredStream(null)}
                            onClick={() => setSelectedProtocol(protocol)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Animated Flow Path */}
                            <motion.path
                                d={`M 170 ${yStart} Q 600 ${yStart} 1000 ${yEnd}`}
                                fill="none"
                                stroke={isHovered ? "#0052FF" : "#0052FF80"}
                                strokeWidth={thickness}
                                opacity={isDimmed ? 0.2 : 1}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, delay: index * 0.2 }}
                            />

                            {/* Animated Pulse */}
                            {!isDimmed && (
                                <motion.circle
                                    r="6"
                                    fill="#0052FF"
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
                                        dur="3s"
                                        repeatCount="indefinite"
                                        path={`M 170 ${yStart} Q 600 ${yStart} 1000 ${yEnd}`}
                                    />
                                </motion.circle>
                            )}

                            {/* Percentage Label */}
                            <motion.text
                                x="600"
                                y={yStart - 20}
                                textAnchor="middle"
                                fill="#0052FF"
                                fontSize="18"
                                fontWeight="bold"
                                opacity={isHovered ? 1 : isDimmed ? 0.2 : 0.6}
                            >
                                {protocol.percentage}%
                            </motion.text>

                            {/* Protocol Node (Right) */}
                            <g>
                                <rect
                                    x="1000"
                                    y={yEnd - 40}
                                    width="150"
                                    height="80"
                                    rx="8"
                                    fill={isHovered ? "#0052FF20" : "#ffffff10"}
                                    stroke="#0052FF"
                                    strokeWidth="2"
                                    opacity={isDimmed ? 0.2 : 1}
                                />
                                <text x="1075" y={yEnd - 10} textAnchor="middle" fill="#ffffff" fontSize="24">
                                    {protocol.icon}
                                </text>
                                <text x="1075" y={yEnd + 10} textAnchor="middle" fill="#0052FF" fontSize="14" fontWeight="bold">
                                    {protocol.name}
                                </text>
                                <text x="1075" y={yEnd + 28} textAnchor="middle" fill="#ffffff80" fontSize="11">
                                    {protocol.percentage}%
                                </text>
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoveredStream && (
                    <motion.div
                        className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#0052FF]/90 backdrop-blur-sm rounded-lg border border-[#0052FF]"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="text-white text-sm font-bold">
                            {protocols.find((p) => p.id === hoveredStream)?.description}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deep Dive Panel (Right Slide-out) */}
            <AnimatePresence>
                {selectedProtocol && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProtocol(null)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="fixed right-0 top-0 bottom-0 w-96 bg-[#050505] border-l border-[#0052FF] z-50 p-8 overflow-y-auto"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25 }}
                        >
                            <button
                                onClick={() => setSelectedProtocol(null)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
                            >
                                ×
                            </button>

                            <div className="text-6xl mb-4">{selectedProtocol.icon}</div>
                            <h2 className="text-3xl font-bold text-[#0052FF] mb-2">{selectedProtocol.name}</h2>
                            <p className="text-white/60 mb-6">{selectedProtocol.description}</p>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-lg border border-[#0052FF]/30">
                                    <div className="text-xs text-white/40 uppercase mb-1">Current APY</div>
                                    <div className="text-2xl font-bold text-[#0052FF]">{selectedProtocol.apy}</div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-[#0052FF]/30">
                                    <div className="text-xs text-white/40 uppercase mb-1">Allocation</div>
                                    <div className="text-2xl font-bold text-white">{selectedProtocol.percentage}%</div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-[#0052FF]/30">
                                    <div className="text-xs text-white/40 uppercase mb-1">Estimated Yield</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        ${((100 * selectedProtocol.percentage / 100) * (parseFloat(selectedProtocol.apy) / 100)).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
