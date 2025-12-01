import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, FileCode, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TimeChamber: React.FC = () => {
    // Mock State: Toggle between 'empty' and 'active' to demonstrate both
    const [hasActiveProposal, setHasActiveProposal] = useState(true);
    const [timeLeft, setTimeLeft] = useState(130365); // Seconds (approx 36h)

    // Countdown Logic
    useEffect(() => {
        if (!hasActiveProposal) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [hasActiveProposal]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className={`w-full border rounded-2xl overflow-hidden mb-8 transition-colors duration-500 ${hasActiveProposal ? 'border-yellow-500/30 bg-yellow-950/10' : 'border-gray-800 bg-[#050505]'}`}>

            {/* Header / Sticky on Mobile */}
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${hasActiveProposal ? 'bg-yellow-950/20 border-yellow-500/30' : 'bg-gray-900/20 border-gray-800'}`}>
                <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${hasActiveProposal ? 'text-yellow-500' : 'text-gray-500'}`} />
                    <h3 className={`font-mono font-bold uppercase tracking-wider ${hasActiveProposal ? 'text-yellow-500' : 'text-gray-500'}`}>
                        The Time Chamber
                    </h3>
                </div>
                {hasActiveProposal && (
                    <div className="font-mono font-bold text-yellow-500 animate-pulse">
                        UNLOCKS IN: {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8">
                {hasActiveProposal ? (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Visual: Suspended Code Block */}
                        <div className="flex-1 relative min-h-[200px] bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs overflow-hidden group">
                            <div className="absolute top-2 right-2 text-[10px] text-gray-600">DIFF VIEW</div>
                            <div className="space-y-1">
                                <div className="text-gray-500">// Strategy Allocation Update</div>
                                <div className="text-gray-500">function rebalance() {'{'}</div>
                                <div className="pl-4 text-red-500">-  target: "Aave", alloc: 6000</div>
                                <div className="pl-4 text-green-500">+  target: "Aave", alloc: 5000</div>
                                <div className="pl-4 text-green-500">+  target: "Compound", alloc: 1000</div>
                                <div className="text-gray-500">{'}'}</div>
                            </div>

                            {/* Glass Reflection Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none" />
                        </div>

                        {/* Info & Actions */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-bold text-sm">PENDING UPGRADE</span>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Strategy Rebalance #142</h4>
                            <p className="text-gray-400 text-sm mb-6">
                                Reducing Aave exposure by 10% and reallocating to Compound to optimize yield spread.
                            </p>

                            <div className="flex gap-3">
                                <button className="flex-1 py-3 bg-red-900/20 border border-red-500/50 text-red-400 font-mono text-sm font-bold rounded hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2">
                                    <XCircle className="w-4 h-4" /> RALLY OPPOSITION
                                </button>
                                <button className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 font-mono text-sm font-bold rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                    <FileCode className="w-4 h-4" /> VIEW FULL DIFF
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-500 mb-2">System Stable</h3>
                        <p className="text-gray-600 font-mono text-sm">No pending upgrades in the Time Chamber.</p>
                        <button
                            onClick={() => setHasActiveProposal(true)}
                            className="mt-6 text-xs text-blue-500/50 hover:text-blue-500 underline"
                        >
                            (Demo: Trigger Proposal)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeChamber;
