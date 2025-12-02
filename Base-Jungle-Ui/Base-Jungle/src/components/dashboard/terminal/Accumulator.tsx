import React from 'react';
import { Database, ArrowUpRight, Globe, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AccumulatorProps {
    points: number;
    multiplier: number;
    velocity: number;
    globalTVL: number;
    avgAPY: number;
    onViewRewards: () => void;
}

const Accumulator: React.FC<AccumulatorProps> = ({
    points,
    multiplier,
    velocity,
    globalTVL,
    avgAPY,
    onViewRewards
}) => {
    return (
        <div className="glass-card rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
            <div className="flex h-full gap-6">

                {/* Vertical Glass Tank */}
                <div className="w-12 h-full glass-tank flex-shrink-0 hidden sm:block relative">
                    {/* Bubbles generated via CSS */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="tank-bubble w-1.5 h-1.5"
                            style={{
                                left: `${Math.random() * 80 + 10}%`,
                                animationDelay: `${Math.random() * 4}s`,
                                animationDuration: `${3 + Math.random() * 3}s`,
                                '--wobble': `${(Math.random() - 0.5) * 20}px`
                            } as React.CSSProperties}
                        />
                    ))}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-600/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                            <Database className="w-5 h-5 text-blue-400" />
                            ACCUMULATOR
                        </h3>
                        <p className="text-xs text-gray-500 font-mono tracking-wider">REWARDS ENGINE</p>
                    </div>

                    <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
                        <div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Current Points</p>
                            <p className="text-3xl font-bold text-white glow-text-blue">
                                {points.toLocaleString()} PTS
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Multiplier</p>
                                <p className="text-lg font-bold text-purple-400">x{multiplier.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Velocity</p>
                                <p className="text-lg font-bold text-green-400">{velocity.toFixed(2)}/hr</p>
                            </div>
                        </div>
                    </div>

                    {/* Ecosystem Vitals */}
                    <div className="pt-4 border-t border-white/5 space-y-2 mb-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Global TVL
                            </span>
                            <span className="text-white font-mono">${(globalTVL / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Avg APY
                            </span>
                            <span className="text-green-400 font-mono">{avgAPY}%</span>
                        </div>
                    </div>

                    <Button
                        onClick={onViewRewards}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono tracking-wider h-10"
                    >
                        VIEW REWARDS <ArrowUpRight className="w-3 h-3 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Accumulator;
