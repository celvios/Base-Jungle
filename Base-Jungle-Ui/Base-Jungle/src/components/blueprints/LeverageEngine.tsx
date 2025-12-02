import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';

interface LeverageEngineProps {
    selectedTier: string;
}

const LeverageEngine: React.FC<LeverageEngineProps> = ({ selectedTier }) => {
    const maxLeverage = selectedTier === 'forest' || selectedTier === 'jungle' ? 5 : 2;
    const [leverage, setLeverage] = useState(1);

    const baseAPY = 12; // Mock base APY
    const projectedAPY = (baseAPY * leverage) - (leverage > 1 ? (leverage * 2) : 0); // Mock borrowing cost
    const liquidationDrop = leverage > 1 ? (100 / leverage) * 0.8 : 100; // Mock liquidation buffer

    return (
        <div className="bg-[#0a0a0a] border border-cyan-900/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-mono text-sm">LEVERAGE ENGINE</h3>
                <div className="px-2 py-1 bg-cyan-900/20 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400">
                    MAX: {maxLeverage}x
                </div>
            </div>

            <div className="mb-8 px-2">
                <Slider
                    defaultValue={[1]}
                    max={maxLeverage}
                    min={1}
                    step={0.1}
                    onValueChange={(val) => setLeverage(val[0])}
                    className="cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
                    <span>1x (Spot)</span>
                    <span>{maxLeverage}x (Max)</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded border border-gray-800 text-center">
                    <div className="text-xs text-gray-500 font-mono mb-1">Projected APY</div>
                    <div className="text-2xl font-bold text-green-400 font-mono">{projectedAPY.toFixed(1)}%</div>
                </div>
                <div className="bg-black/40 p-4 rounded border border-gray-800 text-center">
                    <div className="text-xs text-gray-500 font-mono mb-1">Liquidation Risk</div>
                    <div className={`text-2xl font-bold font-mono ${leverage > 2 ? 'text-red-400' : 'text-green-400'}`}>
                        -{liquidationDrop.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeverageEngine;
