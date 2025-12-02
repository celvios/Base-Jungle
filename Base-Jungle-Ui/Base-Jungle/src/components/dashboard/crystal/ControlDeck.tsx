import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Zap, Shield, TrendingUp } from 'lucide-react';

interface ControlDeckProps {
    autoCompound: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    onToggleAutoCompound: (value: boolean) => void;
    onChangeRisk: (value: 'low' | 'medium' | 'high') => void;
}

const ControlDeck: React.FC<ControlDeckProps> = ({ autoCompound, riskLevel, onToggleAutoCompound, onChangeRisk }) => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-auto">
            <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">

                {/* Auto-Compound Switch */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-500/20">
                        <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white font-mono">AUTO-COMPOUND</div>
                        <div className="text-xs text-gray-500">Reinvests yield automatically</div>
                    </div>
                    <Switch
                        checked={autoCompound}
                        onCheckedChange={onToggleAutoCompound}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px h-12 bg-gray-800" />

                {/* Risk Tolerance Slider */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between mb-4">
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" /> RISK TOLERANCE
                        </div>
                        <div className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${riskLevel === 'low' ? 'bg-green-900/30 text-green-400' :
                                riskLevel === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                    'bg-red-900/30 text-red-400'
                            }`}>
                            {riskLevel}
                        </div>
                    </div>
                    <Slider
                        defaultValue={[riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 50 : 100]}
                        max={100}
                        step={50}
                        onValueChange={(val) => {
                            if (val[0] === 0) onChangeRisk('low');
                            if (val[0] === 50) onChangeRisk('medium');
                            if (val[0] === 100) onChangeRisk('high');
                        }}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono uppercase">
                        <span>Safe</span>
                        <span>Balanced</span>
                        <span>Degen</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ControlDeck;
