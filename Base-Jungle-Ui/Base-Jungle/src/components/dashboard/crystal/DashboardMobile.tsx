import React from 'react';
import { Trophy, Wallet, Zap, Activity } from 'lucide-react';

interface DashboardMobileProps {
    userData: any;
}

const DashboardMobile: React.FC<DashboardMobileProps> = ({ userData }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pt-4">
                <h1 className="text-2xl font-bold font-mono">COMMAND CENTER</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-800">
                    <Trophy className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-mono">#{userData.leaderboardRank}</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Core Reactor (Mobile) */}
                <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/30 rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                    <div className="relative z-10">
                        <div className="text-xs text-blue-400 font-mono uppercase mb-2">Net Worth</div>
                        <div className="text-4xl font-bold text-white mb-1">${userData.netWorth.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">TVL: $12.4M</div>
                    </div>
                </div>

                {/* Points & Referrals Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-gray-400 font-mono">POINTS</span>
                        </div>
                        <div className="text-xl font-bold">{userData.totalPoints.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">+{userData.dailyPointRate}/day</div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-gray-400 font-mono">TIER</span>
                        </div>
                        <div className="text-xl font-bold">{userData.tier}</div>
                        <div className="text-[10px] text-gray-500">{userData.referrals.total} Refs</div>
                    </div>
                </div>

                {/* Recent Logs (Radar Fallback) */}
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500 font-mono uppercase mb-3">System Logs</div>
                    <div className="space-y-2">
                        <div className="text-[10px] font-mono text-green-400">{">"} Harvested 450 AERO</div>
                        <div className="text-[10px] font-mono text-blue-400">{">"} Rebalanced Position #2</div>
                        <div className="text-[10px] font-mono text-gray-400">{">"} System Check: Optimal</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardMobile;
