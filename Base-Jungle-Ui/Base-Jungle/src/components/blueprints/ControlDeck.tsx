import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, Lock } from 'lucide-react';

interface ControlDeckProps {
    selectedTier: string;
    onSelectTier: (tier: string) => void;
}

const tiers = [
    {
        id: 'sprout',
        name: 'SPROUT',
        type: 'Conservative',
        risk: 0.15,
        target: '6-8%',
        lock: '90d',
        lev: '0x',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgHover: 'hover:bg-emerald-950/30',
        bgActive: 'bg-emerald-950/50'
    },
    {
        id: 'tree',
        name: 'TREE',
        type: 'Balanced',
        risk: 0.35,
        target: '12-18%',
        lock: '365d',
        lev: '2x',
        color: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgHover: 'hover:bg-blue-950/30',
        bgActive: 'bg-blue-950/50'
    },
    {
        id: 'forest',
        name: 'FOREST',
        type: 'Aggressive',
        risk: 0.65,
        target: '30-60%',
        lock: '730d',
        lev: '5x',
        color: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        bgHover: 'hover:bg-orange-950/30',
        bgActive: 'bg-orange-950/50'
    }
];

const ControlDeck: React.FC<ControlDeckProps> = ({ selectedTier, onSelectTier }) => {
    return (
        <div className="w-full mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                <h3 className="text-sm font-mono text-cyan-500 tracking-widest uppercase">System Configuration // Tier Selection</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => {
                    const isSelected = selectedTier === tier.id;

                    return (
                        <motion.button
                            key={tier.id}
                            onClick={() => onSelectTier(tier.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                relative p-4 border rounded-lg text-left transition-all duration-300
                ${isSelected ? `${tier.borderColor} ${tier.bgActive} border-2` : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-700'}
              `}
                        >
                            {/* Active Indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <span className="flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tier.color.replace('text-', 'bg-')}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${tier.color.replace('text-', 'bg-')}`}></span>
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-lg font-bold font-mono ${isSelected ? tier.color : 'text-gray-400'}`}>
                                        {tier.name}
                                    </h4>
                                    <span className="text-xs text-gray-500 font-mono uppercase">{tier.type}</span>
                                </div>
                                <div className={`p-2 rounded-md ${isSelected ? 'bg-black/40' : 'bg-gray-900'}`}>
                                    {tier.id === 'sprout' && <Shield className={`w-4 h-4 ${isSelected ? tier.color : 'text-gray-600'}`} />}
                                    {tier.id === 'tree' && <TrendingUp className={`w-4 h-4 ${isSelected ? tier.color : 'text-gray-600'}`} />}
                                    {tier.id === 'forest' && <Zap className={`w-4 h-4 ${isSelected ? tier.color : 'text-gray-600'}`} />}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                    <span className="text-gray-500 block text-[10px]">RISK</span>
                                    <span className="text-white">{tier.risk}</span>
                                </div>
                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                    <span className="text-gray-500 block text-[10px]">TARGET</span>
                                    <span className={tier.color}>{tier.target}</span>
                                </div>
                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                    <span className="text-gray-500 block text-[10px]">LOCK</span>
                                    <span className="text-white">{tier.lock}</span>
                                </div>
                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                    <span className="text-gray-500 block text-[10px]">LEV</span>
                                    <span className="text-white">{tier.lev}</span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default ControlDeck;
