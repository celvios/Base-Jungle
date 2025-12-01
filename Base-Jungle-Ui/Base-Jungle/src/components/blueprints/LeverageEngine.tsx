import React from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, Activity } from 'lucide-react';

interface LeverageEngineProps {
    selectedTier: string;
}

const LeverageEngine: React.FC<LeverageEngineProps> = ({ selectedTier }) => {
    if (selectedTier === 'sprout') return null;

    const isForest = selectedTier === 'forest';
    const ltv = isForest ? 75.0 : 65.0;
    const healthFactor = isForest ? 1.25 : 1.65;
    const maxLtv = 80.0;

    return (
        <div className="w-full mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-mono text-orange-500 tracking-widest uppercase">Leverage Engine // Schematic</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Visual Engine */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-orange-900/30 rounded-lg p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                    <div className="flex items-center justify-center gap-8 h-48 relative z-10">
                        {/* Chamber 1: Collateral */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 border-2 border-blue-500/50 bg-blue-900/10 rounded-lg relative overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-blue-500/30 h-[80%]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-mono font-bold text-blue-300">COLLATERAL</span>
                                </div>
                            </div>
                            <span className="mt-2 font-mono text-xs text-blue-400">$1,000</span>
                        </div>

                        {/* Flywheel Animation */}
                        <div className="flex flex-col items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: isForest ? 2 : 4, repeat: Infinity, ease: "linear" }}
                                className="text-gray-600"
                            >
                                <Settings className="w-12 h-12" />
                            </motion.div>
                            <div className="h-1 w-16 bg-gradient-to-r from-blue-500/50 to-orange-500/50 mt-2 rounded-full" />
                            <span className="text-[10px] font-mono text-gray-500 mt-1">RECURSIVE LOOP</span>
                        </div>

                        {/* Chamber 2: Debt */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 border-2 border-orange-500/50 bg-orange-900/10 rounded-lg relative overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-orange-500/30" style={{ height: `${ltv}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-mono font-bold text-orange-300">DEBT</span>
                                </div>
                            </div>
                            <span className="mt-2 font-mono text-xs text-orange-400">${isForest ? '3,000' : '1,500'}</span>
                        </div>
                    </div>
                </div>

                {/* Safety Readout */}
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 font-mono">
                    <h4 className="text-xs text-gray-500 uppercase mb-4 border-b border-gray-800 pb-2">Safety Diagnostics</h4>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Current LTV</span>
                                <span className="text-white font-bold">{ltv}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${ltv}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Max LTV</span>
                                <span className="text-gray-500">{maxLtv}%</span>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Health Factor
                                </span>
                                <span className={`text-lg font-bold ${healthFactor < 1.4 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {healthFactor}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Auto-Repay Trigger: &lt; 1.40</span>
                            </div>
                        </div>

                        <div className="text-[10px] text-gray-500 leading-relaxed">
                            <span className="text-cyan-500 font-bold">NOTE:</span> Flash loan protection is active.
                            Positions are atomic and cannot be liquidated within a single block.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LeverageEngine;
