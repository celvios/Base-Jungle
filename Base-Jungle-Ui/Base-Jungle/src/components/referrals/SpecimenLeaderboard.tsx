import React from 'react';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    address: string;
    referrals: number;
    rewards: number;
}

const SpecimenLeaderboard: React.FC = () => {
    // Mock data - would come from API
    const leaders: LeaderboardEntry[] = [
        { rank: 1, address: '0x12...45AB', referrals: 142, rewards: 4500 },
        { rank: 2, address: '0x89...CD23', referrals: 98, rewards: 3200 },
        { rank: 3, address: '0x44...11FF', referrals: 76, rewards: 2100 },
        { rank: 4, address: '0xAB...9900', referrals: 45, rewards: 1200 },
        { rank: 5, address: '0xCC...2211', referrals: 32, rewards: 800 },
    ];

    return (
        <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-white font-mono tracking-wider">TOP SPECIMENS</h3>
            </div>

            <div className="space-y-2">
                {leaders.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-blue-500/30">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center rounded font-mono text-xs font-bold ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                        entry.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-gray-800 text-gray-500'
                                }`}>
                                {entry.rank}
                            </div>
                            <span className="text-sm font-mono text-gray-300">{entry.address}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-white">{entry.referrals} Refs</div>
                            <div className="text-xs text-blue-400 font-mono">{entry.rewards} PTS</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpecimenLeaderboard;
