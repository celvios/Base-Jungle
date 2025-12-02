import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Users, Wallet } from 'lucide-react';

interface StatusManifoldProps {
    tier: string;
    depositProgress: number; // 0-100
    networkProgress: number; // 0-100
    depositAmount: string;
    nextTierDeposit: string;
    referralCount: number;
    nextTierReferrals: number;
}

const StatusManifold: React.FC<StatusManifoldProps> = ({
    tier,
    depositProgress,
    networkProgress,
    depositAmount,
    nextTierDeposit,
    referralCount,
    nextTierReferrals
}) => {
    return (
        <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Rank Badge */}
            <div className="flex-shrink-0 flex items-center gap-4 z-10">
                <div className="w-16 h-16 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,82,255,0.2)]">
                    <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Current Rank</div>
                    <h1 className="text-3xl font-bold font-mono text-white tracking-tight">{tier.toUpperCase()}</h1>
                </div>
            </div>

            {/* The Tube System */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 z-10">

                {/* Top Channel: Deposit (Blue Liquid) */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-blue-400 flex items-center gap-2">
                            <Wallet className="w-3 h-3" /> LIQUIDITY PRESSURE
                        </span>
                        <span className="text-gray-400">{depositProgress.toFixed(0)}%</span>
                    </div>
                    {/* The Tube */}
                    <div className="relative h-4 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                        {/* Liquid Fill */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${depositProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        />
                        {/* Bubbles Effect */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                        {/* Whale Marker */}
                        <div className="absolute top-0 bottom-0 right-[10%] w-0.5 bg-white/20" title="Whale Requirement" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                        <span>${depositAmount}</span>
                        <span>Target: ${nextTierDeposit}</span>
                    </div>
                </div>

                {/* Bottom Channel: Network (Cyan Liquid) */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-cyan-400 flex items-center gap-2">
                            <Users className="w-3 h-3" /> SIGNAL STRENGTH
                        </span>
                        <span className="text-gray-400">{networkProgress.toFixed(0)}%</span>
                    </div>
                    {/* The Tube */}
                    <div className="relative h-4 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                        {/* Liquid Fill */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${networkProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-900 via-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        />
                        {/* Bubbles Effect */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                        <span>{referralCount} Active</span>
                        <span>Target: {nextTierReferrals}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StatusManifold;
