import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Gauge } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface PressureGaugeProps {
    currentLeverage: number;
    maxLeverage: number;
    tierLimit: number;
    onLeverageChange: (value: number) => void;
}

const PressureGauge: React.FC<PressureGaugeProps> = ({
    currentLeverage,
    maxLeverage,
    tierLimit,
    onLeverageChange
}) => {
    const [isDragging, setIsDragging] = useState(false);

    // Calculate percentage for visual fill
    const fillPercent = (currentLeverage / maxLeverage) * 100;
    const limitPercent = (tierLimit / maxLeverage) * 100;

    return (
        <div className="col-span-1 bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">

            <div className="flex justify-between items-start mb-4 z-10">
                <div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Gauge className="w-3 h-3" /> Pressure Gauge
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {currentLeverage.toFixed(1)}x <span className="text-sm text-gray-500">LEVERAGE</span>
                    </div>
                </div>
                {currentLeverage >= tierLimit && (
                    <div className="text-xs font-mono text-red-500 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
                        <Lock className="w-3 h-3" /> MAX PRESSURE
                    </div>
                )}
            </div>

            {/* Hydraulic Slider Visual */}
            <div className="relative py-4 z-10">
                {/* Track Background */}
                <div className="h-3 bg-black/50 rounded-full border border-white/10 relative overflow-hidden">
                    {/* Limit Zone (Greyed out) */}
                    <div
                        className="absolute inset-y-0 right-0 bg-gray-900/50 pattern-diagonal-lines"
                        style={{ width: `${100 - limitPercent}%` }}
                    />

                    {/* Active Liquid Fill */}
                    <motion.div
                        className={`absolute inset-y-0 left-0 ${currentLeverage >= tierLimit ? 'bg-red-500' : 'bg-purple-500'} shadow-[0_0_15px_rgba(168,85,247,0.5)]`}
                        style={{ width: `${fillPercent}%` }}
                        animate={{
                            backgroundColor: currentLeverage >= tierLimit ? '#ef4444' : '#a855f7',
                        }}
                    />
                </div>

                {/* Slider Input (Invisible but interactive) */}
                <Slider
                    defaultValue={[currentLeverage]}
                    max={maxLeverage}
                    step={0.1}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onValueChange={(vals) => {
                        const val = vals[0];
                        if (val <= tierLimit) {
                            onLeverageChange(val);
                        } else {
                            // Haptic/Visual feedback for limit hit could go here
                            onLeverageChange(tierLimit);
                        }
                    }}
                />

                {/* Piston Head (Visual only, follows value) */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-8 bg-gray-300 border-2 border-white rounded shadow-lg pointer-events-none flex items-center justify-center"
                    style={{ left: `calc(${fillPercent}% - 12px)` }}
                >
                    <div className="w-0.5 h-4 bg-gray-400" />
                </motion.div>

                {/* Limit Marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-0"
                    style={{ left: `${limitPercent}%` }}
                >
                    <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono text-red-500">MAX</div>
                </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-2">
                <span>1.0x</span>
                <span>{maxLeverage.toFixed(1)}x</span>
            </div>
        </div>
    );
};

export default PressureGauge;
