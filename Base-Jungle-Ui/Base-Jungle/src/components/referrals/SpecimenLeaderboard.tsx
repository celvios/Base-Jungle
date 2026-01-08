import React from 'react';
import { Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_ENDPOINTS } from '@/config/api';

interface LeaderboardEntry {
    rank: number;
    address: string;
    referrals: number;
    points: number;
    tier: string;
}

const SpecimenLeaderboard: React.FC = () => {
    const { address, isConnected } = useAccount();

    const { data: leaders, isLoading, error } = useQuery({
        queryKey: ['my-referrals', address],
        queryFn: async () => {
            if (!address) return [];
            const response = await fetch(API_ENDPOINTS.myReferrals(address));
            if (!response.ok) {
                // If endpoint fails or user not found, 404 is possible -> return empty
                return [];
            }
            return response.json() as Promise<LeaderboardEntry[]>;
        },
        enabled: !!address, // Only fetch if connected
        refetchInterval: 30000,
    });

    const displayLeaders = leaders || [];

    return (
        <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-white font-mono tracking-wider">YOUR SPECIMENS</h3>
                </div>
                {isLoading && <div className="text-xs text-blue-500 animate-pulse">Scanning Bio-Signs...</div>}
            </div>

            <div className="space-y-2">
                {!isConnected ? (
                    <div className="p-4 text-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-lg">
                        Connect wallet to view your colony.
                    </div>
                ) : !isLoading && displayLeaders.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-lg">
                        No active referrals detected.
                    </div>
                ) : (
                    displayLeaders.map((entry, index) => (
                        <div key={entry.address} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-blue-500/30">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 flex items-center justify-center rounded font-mono text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-gray-800 text-gray-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-mono text-gray-300">
                                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                    </span>
                                    {entry.tier && <span className="text-[10px] text-gray-500 uppercase">{entry.tier}</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">{entry.referrals} Sub-Refs</div>
                                <div className="text-xs text-blue-400 font-mono">{entry.points} PTS</div>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    // Skeleton Loading
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-lg"></div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpecimenLeaderboard;
