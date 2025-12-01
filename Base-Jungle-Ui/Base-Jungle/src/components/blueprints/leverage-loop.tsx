import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function LeverageLoop() {
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isAnimating) {
            const interval = setInterval(() => {
                setStep((prev) => {
                    if (prev >= 3) {
                        setIsAnimating(false);
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1500);

            return () => clearInterval(interval);
        }
    }, [isAnimating]);

    const steps = [
        { label: "Supply", amount: 100, color: "#06b6d4" },
        { label: "Borrow", amount: 70, color: "#3b82f6" },
        { label: "Supply", amount: 170, color: "#06b6d4" },
        { label: "Final", amount: 300, color: "#22d3ee" },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
                {/* Circular Loop Visualization */}
                <div className="relative w-96 h-96">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                        {/* Circular path */}
                        <circle
                            cx="200"
                            cy="200"
                            r="120"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="3"
                            opacity="0.3"
                            strokeDasharray="8 4"
                        />

                        {/* Supply node (top) */}
                        <g>
                            <circle
                                cx="200"
                                cy="80"
                                r="40"
                                fill={step >= 0 ? "#06b6d4" : "#0e7490"}
                                opacity="0.2"
                                stroke="#06b6d4"
                                strokeWidth="2"
                            />
                            <text x="200" y="75" textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="bold">
                                SUPPLY
                            </text>
                            <text x="200" y="92" textAnchor="middle" fill="#06b6d4" fontSize="12">
                                ${step >= 2 ? steps[2].amount : steps[0].amount}
                            </text>
                        </g>

                        {/* Borrow node (bottom) */}
                        <g>
                            <circle
                                cx="200"
                                cy="320"
                                r="40"
                                fill={step >= 1 ? "#3b82f6" : "#1e3a8a"}
                                opacity="0.2"
                                stroke="#3b82f6"
                                strokeWidth="2"
                            />
                            <text x="200" y="315" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">
                                BORROW
                            </text>
                            <text x="200" y="332" textAnchor="middle" fill="#3b82f6" fontSize="12">
                                ${steps[1].amount}
                            </text>
                        </g>

                        {/* Animated dot */}
                        {isAnimating && (
                            <motion.circle
                                r="10"
                                fill="#22d3ee"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <animateMotion
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                    path="M 200 120 A 120 120 0 1 1 200 80"
                                />
                            </motion.circle>
                        )}

                        {/* Arrows */}
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3, 0 6" fill="#06b6d4" />
                            </marker>
                        </defs>

                        {/* Arrow from Supply to Borrow */}
                        <path
                            d="M 240 100 Q 280 200 220 300"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                            opacity={step >= 1 ? 1 : 0.3}
                        />

                        {/* Arrow from Borrow back to Supply */}
                        <path
                            d="M 160 300 Q 120 200 180 100"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                            opacity={step >= 2 ? 1 : 0.3}
                        />
                    </svg>

                    {/* Center result */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: step >= 3 ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <div className="text-sm text-white/60">Total Exposure</div>
                        <div className="text-5xl font-bold text-cyan-400 glow-text">
                            ${steps[3].amount}
                        </div>
                        <div className="text-lg text-white/80">3x Leverage</div>
                    </motion.div>
                </div>

                {/* Control Button */}
                <motion.button
                    onClick={() => {
                        setStep(0);
                        setIsAnimating(true);
                    }}
                    className="mt-8 px-8 py-3 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg text-cyan-400 font-bold hover:bg-cyan-500/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isAnimating}
                >
                    {isAnimating ? "Running..." : "Run Simulation"}
                </motion.button>

                {/* Explanation */}
                <div className="mt-12 p-6 bg-white/5 border border-cyan-400/30 rounded-lg max-w-2xl">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">How It Works</h3>
                    <div className="space-y-3 text-white/80">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <strong>Initial Supply:</strong> Deposit $100 USDC as collateral
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <strong>Borrow:</strong> Borrow $70 USDC (70% LTV)
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <strong>Re-Supply:</strong> Supply the borrowed $70, now total = $170
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                                4
                            </div>
                            <div>
                                <strong>Repeat:</strong> Loop continues until reaching 3x exposure ($300)
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/50 rounded-lg">
                        <p className="text-sm text-cyan-300">
                            <strong>⚡ Automated Safety:</strong> The Lending Manager monitors Health Factor every block and auto-repays if it drops below 1.4 to prevent liquidation.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        .glow-text {
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
        }
      `}</style>
        </div>
    );
}
