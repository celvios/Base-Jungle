import React, { useState, useEffect } from 'react';
import { Sliders, AlertOctagon, PlayCircle } from 'lucide-react';

interface SimulationBenchProps {
    selectedTier: string;
}

const SimulationBench: React.FC<SimulationBenchProps> = ({ selectedTier }) => {
    const [volatility, setVolatility] = useState(0); // -20 to +20
    const [days, setDays] = useState(0); // 0 to 365
    const [healthFactor, setHealthFactor] = useState(1.8);
    const [yieldEarned, setYieldEarned] = useState(0);
    const [guardianActive, setGuardianActive] = useState(false);

    // Reset on tier change
    useEffect(() => {
        setVolatility(0);
        setDays(0);
        setHealthFactor(selectedTier === 'forest' ? 1.5 : 1.8);
        setGuardianActive(false);
    }, [selectedTier]);

    // Calculate effects
    useEffect(() => {
        // Health Factor Logic
        const baseHF = selectedTier === 'forest' ? 1.5 : 1.8;
        // Volatility impact: -20% crash reduces HF significantly
        const volImpact = volatility < 0 ? (volatility / 100) * 2 : (volatility / 100) * 0.5;
        let newHF = baseHF + volImpact;

        // Guardian Bot Logic
        if (newHF < 1.4) {
            setGuardianActive(true);
            newHF = 1.45; // Bot restores it
        } else {
            setGuardianActive(false);
        }
        setHealthFactor(parseFloat(newHF.toFixed(2)));

        // Yield Logic
        const apy = selectedTier === 'forest' ? 0.45 : selectedTier === 'tree' ? 0.15 : 0.07;
        const dailyYield = (1000 * apy) / 365;
        setYieldEarned(Math.floor(dailyYield * days));

    }, [volatility, days, selectedTier]);

    return (
        <div className="w-full mt-8">
            <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-mono text-pink-500 tracking-widest uppercase">Simulation Bench // Stress Test</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2 font-mono text-xs">
                                <span className="text-gray-400">Market Volatility</span>
                                <span className={`${volatility < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {volatility > 0 ? '+' : ''}{volatility}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-20"
                                max="20"
                                value={volatility}
                                onChange={(e) => setVolatility(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <div className="flex justify-between mt-1 text-[10px] text-gray-600 font-mono">
                                <span>CRASH (-20%)</span>
                                <span>BULL (+20%)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2 font-mono text-xs">
                                <span className="text-gray-400">Time Elapsed</span>
                                <span className="text-white">{days} Days</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="365"
                                value={days}
                                onChange={(e) => setDays(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>

                    {/* Readouts */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* Health Factor Monitor */}
                        <div className={`p-4 rounded border ${guardianActive ? 'bg-red-900/20 border-red-500 animate-pulse' : 'bg-gray-900/50 border-gray-800'} flex flex-col justify-center items-center text-center relative overflow-hidden`}>
                            {guardianActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 z-10">
                                    <div className="text-red-500 font-bold font-mono text-xs flex flex-col items-center animate-bounce">
                                        <AlertOctagon className="w-6 h-6 mb-1" />
                                        GUARDIAN BOT<br />ACTIVATED
                                    </div>
                                </div>
                            )}
                            <span className="text-xs text-gray-500 font-mono uppercase mb-1">Health Factor</span>
                            <span className={`text-3xl font-bold font-mono ${healthFactor < 1.5 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                {healthFactor}
                            </span>
                        </div>

                        {/* Yield Projector */}
                        <div className="p-4 rounded bg-gray-900/50 border border-gray-800 flex flex-col justify-center items-center text-center">
                            <span className="text-xs text-gray-500 font-mono uppercase mb-1">Projected Yield</span>
                            <span className="text-3xl font-bold font-mono text-white">
                                +{yieldEarned} <span className="text-sm text-gray-500">PTS</span>
                            </span>
                            <span className="text-[10px] text-gray-600 font-mono mt-1">Based on current APY</span>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default SimulationBench;
