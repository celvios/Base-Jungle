import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface SimulationBenchProps {
    selectedTier: string;
}

const SimulationBench: React.FC<SimulationBenchProps> = ({ selectedTier }) => {
    const [amount, setAmount] = useState('1000');
    const [days, setDays] = useState('30');

    const apy = selectedTier === 'sprout' ? 12 : selectedTier === 'tree' ? 25 : 45;
    const dailyRate = apy / 365 / 100;
    const projectedReturn = parseFloat(amount) * dailyRate * parseFloat(days);

    return (
        <div className="bg-[#0a0a0a] border border-cyan-900/30 rounded-xl p-6">
            <h3 className="text-cyan-500 font-mono text-sm mb-6 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                SIMULATION BENCH
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="text-xs text-gray-500 font-mono uppercase mb-2 block">Deposit Amount ($)</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-black/50 border-gray-800 font-mono text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-mono uppercase mb-2 block">Duration (Days)</label>
                    <Input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="bg-black/50 border-gray-800 font-mono text-white"
                    />
                </div>
            </div>

            <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-4 flex items-center justify-between">
                <div className="text-sm text-cyan-400 font-mono">ESTIMATED YIELD</div>
                <div className="text-xl font-bold text-white font-mono">
                    +${projectedReturn.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default SimulationBench;
