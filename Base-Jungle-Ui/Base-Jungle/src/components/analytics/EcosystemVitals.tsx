import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Droplets, Database } from 'lucide-react';

// --- Sub-Components ---

const Odometer = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = { value: displayValue };
        const target = value;

        // Simple lerp for visual effect
        const interval = setInterval(() => {
            setDisplayValue(prev => {
                const diff = target - prev;
                if (Math.abs(diff) < 1) return target;
                return prev + diff * 0.1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [value]);

    return (
        <div className="font-mono text-3xl font-bold tracking-tighter text-white">
            ${Math.floor(displayValue).toLocaleString()}
        </div>
    );
};

const Sparkline = () => (
    <svg width="100" height="30" viewBox="0 0 100 30" className="opacity-50">
        <path
            d="M0,15 Q10,5 20,15 T40,15 T60,5 T80,20 T100,10"
            fill="none"
            stroke="#0052FF"
            strokeWidth="2"
            className="animate-pulse"
        />
    </svg>
);

const VerticalGauge = ({ value }: { value: number }) => (
    <div className="h-12 w-2 bg-gray-900 rounded-full overflow-hidden relative">
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.min(value, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute bottom-0 w-full bg-[#0052FF]"
        />
    </div>
);

const CoinStack = () => (
    <div className="flex flex-col-reverse -space-y-3">
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-6 h-2 rounded-[100%] border border-[#0052FF] bg-[#0052FF]/20"
            />
        ))}
    </div>
);

// --- Main Component ---

const EcosystemVitals: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[800px] gap-8">

                {/* Metric 1: Total Biomass (TVL) */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-blue-900/10 rounded-lg border border-blue-500/20">
                        <Database className="w-6 h-6 text-[#0052FF]" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Biomass (TVL)</div>
                        <div className="flex items-center gap-3">
                            <Odometer value={12450200} />
                            <Sparkline />
                        </div>
                        <div className="text-xs text-[#0052FF] mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +2.4% (24h)
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-gray-800" />

                {/* Metric 2: Rainfall Rate (APY) */}
                <div className="flex items-center gap-4 flex-1">
                    <VerticalGauge value={65} /> {/* Visual representation of 14.2% relative to max */}
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rainfall Rate (Avg APY)</div>
                        <div className="text-2xl font-mono font-bold text-white">14.2%</div>
                        <div className="text-xs text-gray-400">Current Market Best</div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-gray-800" />

                {/* Metric 3: Nutrient Flow (Revenue) */}
                <div className="flex items-center gap-4 flex-1">
                    <CoinStack />
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nutrient Flow</div>
                        <div className="text-2xl font-mono font-bold text-white">$45,200</div>
                        <div className="text-xs text-gray-400">15% Yield Fee</div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-gray-800" />

                {/* Metric 4: Active Species (Users) */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                        <Users className="w-6 h-6 text-gray-400" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0052FF] rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0052FF] rounded-full" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Species</div>
                        <div className="text-2xl font-mono font-bold text-white">1,204</div>
                        <div className="text-xs text-gray-400">Unique Wallets</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EcosystemVitals;
