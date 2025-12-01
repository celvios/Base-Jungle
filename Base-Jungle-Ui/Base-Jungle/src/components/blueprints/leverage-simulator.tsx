import { motion } from "framer-motion";
import { useState } from "react";

export function LeverageSimulator() {
    const [leverage, setLeverage] = useState(1);
    const [principal, setPrincipal] = useState(1000);

    const borrowed = principal * (leverage - 1);
    const totalExposure = principal * leverage;
    const baseYield = principal * 0.15; // 15% base APY
    const leveragedYield = totalExposure * 0.15;
    const debt = borrowed;

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-white/60 mb-3">Leverage Multiplier</label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>1x</span>
                            <span className="text-2xl font-bold text-[#0052FF]">{leverage}x</span>
                            <span>5x</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-3">Principal Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                            <input
                                type="number"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-[#0052FF]/30 rounded-lg text-white focus:outline-none focus:border-[#0052FF]"
                            />
                        </div>
                    </div>

                    {leverage >= 5 && (
                        <motion.div
                            className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="flex items-center gap-2 text-red-400">
                                <span className="text-xl">⚠️</span>
                                <span className="text-sm font-bold">Requires Health Factor Monitoring</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right: Visual Blocks */}
                <div className="space-y-3">
                    {/* Block 1: Your Capital */}
                    <motion.div
                        className="p-6 bg-[#0052FF]/20 border-2 border-[#0052FF] rounded-lg"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="text-xs text-white/60 uppercase mb-1">Your Capital</div>
                        <div className="text-3xl font-bold text-[#0052FF]">${principal.toLocaleString()}</div>
                    </motion.div>

                    {/* Block 2: Borrowed Capital */}
                    {leverage > 1 && (
                        <motion.div
                            className="p-6 bg-transparent border-2 border-[#0052FF] border-dashed rounded-lg"
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="text-xs text-white/60 uppercase mb-1">Borrowed Capital</div>
                            <div className="text-3xl font-bold text-[#0052FF]">${borrowed.toLocaleString()}</div>
                        </motion.div>
                    )}

                    {/* Block 3: Debt */}
                    {leverage > 1 && (
                        <motion.div
                            className="p-6 bg-transparent border-2 border-red-500 border-dashed rounded-lg"
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="text-xs text-white/60 uppercase mb-1">Debt</div>
                            <div className="text-3xl font-bold text-red-400">-${debt.toLocaleString()}</div>
                        </motion.div>
                    )}

                    {/* Result */}
                    <motion.div
                        className="p-6 bg-white/5 border border-white/20 rounded-lg mt-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-white/60 uppercase mb-1">Total Exposure</div>
                                <div className="text-2xl font-bold text-white">${totalExposure.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-white/60 uppercase mb-1">Projected Yield</div>
                                <div className="text-2xl font-bold text-green-400">${leveragedYield.toFixed(0)}</div>
                                <div className="text-xs text-white/40">vs ${baseYield.toFixed(0)} without leverage</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0052FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 82, 255, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0052FF;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 82, 255, 0.5);
        }
      `}</style>
        </div>
    );
}
