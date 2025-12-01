import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Activity, CheckCircle } from 'lucide-react';

const SystemIntegrity: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="w-full mb-12 relative">
            {/* Mobile Header Badge (Visible only on small screens) */}
            <div className="md:hidden flex items-center justify-between bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-cyan-400" />
                    <div>
                        <div className="text-xs text-cyan-500 font-mono uppercase tracking-wider">Security Score</div>
                        <div className="text-xl font-bold text-white font-mono">98/100</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Threat Level</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">NONE</div>
                </div>
            </div>

            {/* Desktop Rotating Shield Ring */}
            <div className="hidden md:flex flex-col items-center justify-center py-12 relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Outer Ring (Audits) */}
                    <motion.div
                        className="absolute inset-0 border-2 border-cyan-500 rounded-full opacity-30"
                        animate={{ rotate: 360, scale: isHovered ? 1.2 : 1 }}
                        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5 } }}
                    />
                    <motion.div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-cyan-500 text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{ y: isHovered ? -20 : 0 }}
                    >
                        Codebase Verified
                    </motion.div>

                    {/* Middle Ring (Timelock) */}
                    <motion.div
                        className="absolute inset-4 border-2 border-dashed border-cyan-500/50 rounded-full"
                        animate={{ rotate: -360, scale: isHovered ? 1.1 : 1 }}
                        transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5 } }}
                    />
                    <motion.div
                        className="absolute top-1/2 -right-24 -translate-y-1/2 text-cyan-500 text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{ x: isHovered ? 20 : 0 }}
                    >
                        Governance Delayed
                    </motion.div>

                    {/* Inner Ring (Health) */}
                    <motion.div
                        className="absolute inset-8 border-4 border-cyan-400/20 rounded-full"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-cyan-500 text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{ y: isHovered ? 20 : 0 }}
                    >
                        Solvency 100%
                    </motion.div>

                    {/* Center Data */}
                    <div className="text-center z-10">
                        <div className="text-4xl font-bold text-white font-mono tracking-tighter">98</div>
                        <div className="text-xs text-cyan-500 font-mono uppercase tracking-widest mt-1">Security Score</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 rounded-full">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-cyan-400 font-mono text-sm font-bold tracking-wider group-hover:animate-pulse">
                            THREAT LEVEL: {isHovered ? "SCANNING..." : "NONE"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemIntegrity;
