import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function BotLogic() {
    const [isScanning, setIsScanning] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [bestProtocol, setBestProtocol] = useState<string | null>(null);
    const [fundsMoving, setFundsMoving] = useState(false);
    const { toast } = useToast();

    const runScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setBestProtocol("Moonwell");
            setIsScanning(false);
            toast({
                title: "✅ Scan Complete",
                description: "Moonwell has the best APY (10.2%)",
            });
        }, 2000);
    };

    const simulateMarketShift = () => {
        setIsSimulating(!isSimulating);
        if (!isSimulating) {
            setTimeout(() => {
                setFundsMoving(true);
                toast({
                    title: "🤖 Rebalancer Triggered",
                    description: "Moving funds from Aave to Moonwell",
                });
                setTimeout(() => setFundsMoving(false), 3000);
            }, 1500);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Scanner Row */}
            <div className="p-6 bg-white/5 border border-[#0052FF]/30 rounded-lg font-mono">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="text-xs text-white/40 uppercase mb-2">The Scanner</div>
                        <div className="text-sm text-white">
                            <span className="text-[#0052FF]">IF</span> (Current_Time == 5_Mins){" "}
                            <span className="text-[#0052FF]">THEN</span> (Scan_All_Protocols)
                        </div>
                    </div>
                    <button
                        onClick={runScan}
                        disabled={isScanning}
                        className="px-6 py-2 bg-[#0052FF]/20 border border-[#0052FF] rounded text-[#0052FF] hover:bg-[#0052FF]/30 disabled:opacity-50 transition-all"
                    >
                        {isScanning ? "Scanning..." : "Run Test"}
                    </button>
                </div>

                {bestProtocol && (
                    <motion.div
                        className="p-4 bg-green-500/10 border border-green-500/50 rounded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                    >
                        <div className="text-green-400 text-sm">
                            ✅ Best APY Found: <strong>{bestProtocol}</strong>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Rebalancer Row */}
            <div className="p-6 bg-white/5 border border-[#0052FF]/30 rounded-lg font-mono">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="text-xs text-white/40 uppercase mb-2">The Rebalancer</div>
                        <div className="text-sm text-white">
                            <span className="text-[#0052FF]">IF</span> (New_APY &gt; Current_APY + 0.5%){" "}
                            <span className="text-[#0052FF]">THEN</span> (Move_Funds)
                        </div>
                    </div>
                    <button
                        onClick={simulateMarketShift}
                        className={`px-6 py-2 border rounded transition-all ${isSimulating
                            ? "bg-green-500/20 border-green-500 text-green-400"
                            : "bg-[#0052FF]/20 border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF]/30"
                            }`}
                    >
                        {isSimulating ? "Simulating..." : "Simulate Market Shift"}
                    </button>
                </div>

                {isSimulating && (
                    <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                    >
                        {/* APY Change */}
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded">
                            <div className="text-yellow-400 text-sm">
                                📈 Moonwell APY jumped to <strong>10%</strong>
                            </div>
                        </div>

                        {/* Trigger Indicator */}
                        {fundsMoving && (
                            <motion.div
                                className="p-4 bg-green-500/10 border border-green-500/50 rounded"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="text-green-400 text-sm font-bold">
                                    ✅ TRIGGERED - Moving funds from Aave → Moonwell
                                </div>
                            </motion.div>
                        )}

                        {/* Visual Flow */}
                        <svg viewBox="0 0 600 100" className="w-full h-20">
                            <text x="50" y="50" fill="#0052FF" fontSize="14" fontWeight="bold">
                                Aave (8%)
                            </text>
                            {fundsMoving && (
                                <motion.path
                                    d="M 150 50 L 450 50"
                                    stroke="#0052FF"
                                    strokeWidth="3"
                                    fill="none"
                                    markerEnd="url(#arrow)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2 }}
                                />
                            )}
                            <text x="470" y="50" fill="#22d3ee" fontSize="14" fontWeight="bold">
                                Moonwell (10%)
                            </text>
                            <defs>
                                <marker
                                    id="arrow"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3, 0 6" fill="#0052FF" />
                                </marker>
                            </defs>
                        </svg>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
