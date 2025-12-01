import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Terminal, X } from 'lucide-react';

const SimulationWidget: React.FC = () => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    const handleSimulate = () => {
        setIsSimulating(true);
        setShowReceipt(false);

        // Simulate processing time
        setTimeout(() => {
            setIsSimulating(false);
            setShowReceipt(true);
        }, 1500);
    };

    return (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 relative overflow-hidden h-64 flex flex-col items-center justify-center">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20 pointer-events-none" />

            {!showReceipt ? (
                <div className="z-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                        <Terminal className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">System Diagnostics</h3>
                        <p className="text-xs text-gray-500 max-w-[200px] mx-auto mt-1">
                            Run a dry-run simulation of the Harvester bot to verify profitability logic.
                        </p>
                    </div>

                    <button
                        onClick={handleSimulate}
                        disabled={isSimulating}
                        className="group relative px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm font-bold rounded overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center space-x-2">
                            {isSimulating ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                    <span>RUNNING...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    <span>SIMULATE HARVEST</span>
                                </>
                            )}
                        </span>
                        {/* Button Glow */}
                        <div className="absolute inset-0 bg-blue-400/20 blur-md group-hover:bg-blue-400/40 transition-all" />
                    </button>
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="z-10 w-full max-w-xs bg-[#050505] border border-blue-500/50 rounded p-4 shadow-[0_0_30px_rgba(0,82,255,0.15)] relative"
                    >
                        {/* Holographic Scanline */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none"
                            animate={{ top: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />

                        <button
                            onClick={() => setShowReceipt(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-center mb-4">
                            <div className="text-xs font-mono text-blue-500 uppercase tracking-widest mb-1">Simulation Result</div>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Simulated Claim</span>
                                <span className="text-white">450 AERO</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Swap Output</span>
                                <span className="text-white">500 USDC</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Gas Estimate</span>
                                <span className="text-red-400">$0.04</span>
                            </div>
                            <div className="h-px w-full bg-gray-800 my-2" />
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-400">Net Profit</span>
                                <span className="text-green-400">$499.96</span>
                            </div>
                        </div>

                        <div className="mt-4 text-[10px] text-center text-gray-600">
                            *Dry run only. No gas spent.
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default SimulationWidget;
