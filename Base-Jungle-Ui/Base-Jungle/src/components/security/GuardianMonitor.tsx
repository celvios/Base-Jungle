import React, { useState, useEffect } from 'react';
import { Activity, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const GuardianMonitor: React.FC = () => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [healthFactor, setHealthFactor] = useState(2.15);
    const [statusLog, setStatusLog] = useState<string[]>(['Scanning Leverage Positions... [COMPLETE]', 'Global Health Factor: 2.15 (Safe)', 'Liquidation Proximity: SAFE (Buffer > 15%)']);

    const handleSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);

        // Simulation Sequence
        setTimeout(() => {
            setHealthFactor(1.1); // Crash
            setStatusLog(prev => ['MARKET CRASH DETECTED (-20%)', ...prev]);
        }, 1000);

        setTimeout(() => {
            setStatusLog(prev => ['AUTO-REPAY TRIGGERED...', ...prev]);
        }, 2000);

        setTimeout(() => {
            setHealthFactor(1.4); // Recovery
            setStatusLog(prev => ['POSITION SAVED. HEALTH FACTOR RESTORED TO 1.4', ...prev]);
            setIsSimulating(false);
        }, 3500);
    };

    return (
        <div className="w-full bg-[#050505] border border-gray-800 rounded-2xl p-6 mb-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Activity className={`w-6 h-6 ${isSimulating && healthFactor < 1.2 ? 'text-white animate-pulse' : 'text-cyan-400'}`} />
                    <h2 className="text-xl font-bold font-mono text-white">THE GUARDIAN</h2>
                </div>
                <div className="hidden md:block">
                    <button
                        onClick={handleSimulation}
                        disabled={isSimulating}
                        className={`px-4 py-2 font-mono text-xs font-bold rounded border transition-all ${isSimulating
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                                : 'bg-red-900/20 text-red-400 border-red-500/50 hover:bg-red-900/40'
                            }`}
                    >
                        {isSimulating ? 'SIMULATION ACTIVE...' : 'SIMULATE MARKET CRASH (-20%)'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* EKG Monitor Visual */}
                <div className="lg:col-span-2 bg-black border border-gray-800 rounded-lg h-64 relative overflow-hidden flex items-center justify-center">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    {/* EKG Line (SVG Animation) */}
                    <svg className="w-full h-full absolute inset-0 pointer-events-none">
                        <motion.path
                            d={`M0,128 L100,128 L110,${isSimulating && healthFactor < 1.2 ? 50 : 110} L120,${isSimulating && healthFactor < 1.2 ? 200 : 140} L130,128 L200,128 L210,${isSimulating && healthFactor < 1.2 ? 40 : 115} L220,${isSimulating && healthFactor < 1.2 ? 210 : 145} L230,128 L1000,128`}
                            fill="none"
                            stroke={isSimulating && healthFactor < 1.2 ? "#FFFFFF" : "#22d3ee"}
                            strokeWidth="2"
                            initial={{ pathLength: 0, x: -1000 }}
                            animate={{ pathLength: 1, x: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </svg>

                    {/* Health Value Overlay */}
                    <div className="absolute top-4 right-4 text-right">
                        <div className="text-xs text-gray-500 font-mono uppercase">Health Factor</div>
                        <div className={`text-3xl font-bold font-mono ${healthFactor < 1.2 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                            {healthFactor.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Data Stream Log */}
                <div className="bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto">
                    <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2">SYSTEM LOGS_</div>
                    <div className="space-y-2">
                        {statusLog.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`${i === 0 ? 'text-white font-bold' : 'text-gray-500'}`}
                            >
                                <span className="text-cyan-500 mr-2">{'>'}</span>
                                {log}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Simulation Note */}
            <div className="md:hidden mt-4 text-center">
                <p className="text-[10px] text-gray-600 font-mono">Simulation mode available on desktop.</p>
            </div>
        </div>
    );
};

export default GuardianMonitor;
