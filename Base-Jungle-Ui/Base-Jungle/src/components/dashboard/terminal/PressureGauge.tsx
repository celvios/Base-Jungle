import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Gauge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PressureGaugeProps {
    currentLeverage: number;
    maxLeverage: number;
    tierLimit: number;
    tierName: string;
    nextTierName: string;
    nextTierRequirement: string;
    healthFactor: number;
    liquidationPrice: number;
    onLeverageChange: (value: number) => void;
}

const PressureGauge: React.FC<PressureGaugeProps> = ({
    currentLeverage,
    maxLeverage,
    tierLimit,
    tierName,
    nextTierName,
    nextTierRequirement,
    healthFactor,
    liquidationPrice,
    onLeverageChange
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localLeverage, setLocalLeverage] = useState(currentLeverage);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        setLocalLeverage(currentLeverage);
    }, [currentLeverage]);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => {
        setIsDragging(false);
        onLeverageChange(localLeverage);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const newValue = 1 + (percentage * (maxLeverage - 1));

        // Snap to 0.1 increments
        const snappedValue = Math.round(newValue * 10) / 10;

        if (snappedValue > tierLimit) {
            setLocalLeverage(tierLimit);
            if (!shake) {
                setShake(true);
                setTimeout(() => setShake(false), 400);
            }
        } else {
            setLocalLeverage(snappedValue);
        }
    };

    const getPercentage = (value: number) => {
        return ((value - 1) / (maxLeverage - 1)) * 100;
    };

    return (
        <div className="glass-card rounded-xl p-6 space-y-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-cyan-400" />
                        PRESSURE GAUGE
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1 tracking-wider">LEVERAGE CONTROL</p>
                </div>
                <div className={`px-3 py-1 rounded-full border ${healthFactor < 1.5 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}>
                    <span className="text-xs font-mono font-bold">HF: {healthFactor.toFixed(2)}</span>
                </div>
            </div>

            {/* Hydraulic Slider */}
            <div className="py-6">
                <div
                    className={`hydraulic-track cursor-pointer ${shake ? 'animate-shake' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    {/* Fill */}
                    <div
                        className="hydraulic-fill"
                        style={{ width: `${getPercentage(localLeverage)}%` }}
                    />

                    {/* Thumb */}
                    <div
                        className={`hydraulic-thumb ${localLeverage >= tierLimit ? 'locked' : ''}`}
                        style={{ left: `${getPercentage(localLeverage)}%` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-mono text-blue-400 whitespace-nowrap">
                            {localLeverage.toFixed(1)}x
                        </div>
                    </div>

                    {/* Limit Marker */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-0"
                        style={{ left: `${getPercentage(tierLimit)}%` }}
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute -top-2 -translate-x-1/2 text-red-500 cursor-help">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-red-500/20 text-red-200">
                                    <p>Upgrade to {nextTierName} to unlock higher leverage</p>
                                    <p className="text-xs text-red-400 mt-1">Requires {nextTierRequirement}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Markers */}
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-mono text-gray-600 select-none pointer-events-none">
                        <span>1x</span>
                        <span>2x</span>
                        <span>3x</span>
                        <span>4x</span>
                        <span>5x</span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                    <p className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-wider">Liquidation Price</p>
                    <p className="text-lg font-bold text-white">${liquidationPrice.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-wider">Max Leverage</p>
                    <p className="text-lg font-bold text-gray-400">{tierLimit.toFixed(1)}x <span className="text-xs font-normal text-gray-600">/ {maxLeverage}x</span></p>
                </div>
            </div>

            {healthFactor < 1.2 && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-400">Warning: Liquidation risk high. Add collateral.</p>
                </div>
            )}
        </div>
    );
};

export default PressureGauge;
