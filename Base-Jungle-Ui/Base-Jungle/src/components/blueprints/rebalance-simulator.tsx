import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function RebalanceSimulator() {
    const [aaveApy, setAaveApy] = useState(8);
    const [isRebalancing, setIsRebalancing] = useState(false);
    const { toast } = useToast();

    const handleApyChange = (value: number) => {
        setAaveApy(value);

        if (value < 5 && !isRebalancing) {
            setIsRebalancing(true);
            toast({
                title: "🤖 Rebalancer Bot Activated",
                description: `Aave APY dropped to ${value}%. Detecting better opportunities...`,
            });

            setTimeout(() => {
                toast({
                    title: "✅ Rebalance Complete",
                    description: "Funds moved to Moonwell (10% APY). Saved 5% yield.",
                });
                setIsRebalancing(false);
            }, 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Control Panel */}
            <div className="p-8 bg-white/5 border border-cyan-400/30 rounded-lg">
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">What-If Simulator</h3>

                <div className="space-y-6">
                    {/* APY Slider */}
                    <div>
                        <div className="flex justify-between mb-3">
                            <label className="text-white/80">Aave APY</label>
                            <span className="text-cyan-400 font-bold">{aaveApy}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            value={aaveApy}
                            onChange={(e) => handleApyChange(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>0%</span>
                            <span>15%</span>
                        </div>
                    </div>

                    {/* Bot Status */}
                    <motion.div
                        className={`p-4 rounded-lg border-2 transition-all ${isRebalancing
                                ? "border-cyan-400 bg-cyan-400/10"
                                : "border-white/10 bg-white/5"
                            }`}
                        animate={{
                            scale: isRebalancing ? [1, 1.02, 1] : 1,
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: isRebalancing ? Infinity : 0,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-3 h-3 rounded-full ${isRebalancing ? "bg-cyan-400 animate-pulse" : "bg-white/30"
                                    }`}
                            />
                            <span className="font-bold text-white">
                                {isRebalancing ? "Rebalancing in progress..." : "Monitoring markets"}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Visual Flow Diagram */}
            <div className="mt-8">
                <svg viewBox="0 0 800 300" className="w-full h-auto">
                    {/* Aave (left) */}
                    <g>
                        <rect
                            x="50"
                            y="100"
                            width="150"
                            height="100"
                            rx="10"
                            fill={aaveApy >= 5 ? "#06b6d4" : "#0e7490"}
                            opacity="0.2"
                            stroke="#06b6d4"
                            strokeWidth="2"
                        />
                        <text x="125" y="140" textAnchor="middle" fill="#06b6d4" fontSize="18" fontWeight="bold">
                            Aave
                        </text>
                        <text x="125" y="165" textAnchor="middle" fill="#06b6d4" fontSize="24" fontWeight="bold">
                            {aaveApy}%
                        </text>
                    </g>

                    {/* Moonwell (right) */}
                    <g>
                        <rect
                            x="600"
                            y="100"
                            width="150"
                            height="100"
                            rx="10"
                            fill={aaveApy < 5 ? "#22d3ee" : "#0e7490"}
                            opacity="0.2"
                            stroke="#22d3ee"
                            strokeWidth="2"
                        />
                        <text x="675" y="140" textAnchor="middle" fill="#22d3ee" fontSize="18" fontWeight="bold">
                            Moonwell
                        </text>
                        <text x="675" y="165" textAnchor="middle" fill="#22d3ee" fontSize="24" fontWeight="bold">
                            10%
                        </text>
                    </g>

                    {/* Flow arrow */}
                    <defs>
                        <marker
                            id="rebalance-arrow"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3, 0 6" fill={isRebalancing ? "#22d3ee" : "#06b6d4"} />
                        </marker>
                    </defs>

                    {isRebalancing && (
                        <motion.path
                            d="M 200 150 L 600 150"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="3"
                            markerEnd="url(#rebalance-arrow)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}

                    {/* Bot icon (center) */}
                    <g>
                        <circle
                            cx="400"
                            cy="150"
                            r="30"
                            fill={isRebalancing ? "#22d3ee" : "#06b6d4"}
                            opacity="0.2"
                            stroke={isRebalancing ? "#22d3ee" : "#06b6d4"}
                            strokeWidth="2"
                        />
                        <text x="400" y="160" textAnchor="middle" fill={isRebalancing ? "#22d3ee" : "#06b6d4"} fontSize="30">
                            🤖
                        </text>
                    </g>
                </svg>
            </div>

            {/* Info cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 border border-cyan-400/30 rounded-lg">
                    <h4 className="font-bold text-cyan-400 mb-2">Trigger Conditions</h4>
                    <ul className="text-sm text-white/70 space-y-2">
                        <li>• APY difference &gt; 3%</li>
                        <li>• Gas cost &lt; potential gain</li>
                        <li>• Protocol health score &gt; 90%</li>
                    </ul>
                </div>
                <div className="p-6 bg-white/5 border border-cyan-400/30 rounded-lg">
                    <h4 className="font-bold text-cyan-400 mb-2">Rebalance Frequency</h4>
                    <ul className="text-sm text-white/70 space-y-2">
                        <li>• Checks every 4 hours</li>
                        <li>• Max 1 rebalance per day</li>
                        <li>• Emergency override available</li>
                    </ul>
                </div>
            </div>

            <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      `}</style>
        </div>
    );
}
