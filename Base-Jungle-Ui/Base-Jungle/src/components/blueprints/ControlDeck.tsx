import React from 'react';
import { cn } from '@/lib/utils';
import { Sprout, TreeDeciduous, Mountain, Zap } from 'lucide-react';

interface ControlDeckProps {
    selectedTier: string;
    onSelectTier: (tier: string) => void;
}

const tiers = [
    { id: 'sprout', name: 'Sprout', icon: Sprout, color: 'text-green-400', border: 'border-green-500/50' },
    { id: 'tree', name: 'Tree', icon: TreeDeciduous, color: 'text-emerald-400', border: 'border-emerald-500/50' },
    { id: 'forest', name: 'Forest', icon: Mountain, color: 'text-blue-400', border: 'border-blue-500/50' },
    { id: 'jungle', name: 'Jungle', icon: Zap, color: 'text-purple-400', border: 'border-purple-500/50' },
];

const ControlDeck: React.FC<ControlDeckProps> = ({ selectedTier, onSelectTier }) => {
    return (
        <div className="w-full mb-8">
            <div className="flex flex-wrap gap-4 p-2 bg-black/40 border border-gray-800 rounded-lg backdrop-blur-sm">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isSelected = selectedTier === tier.id;
                    return (
                        <button
                            key={tier.id}
                            onClick={() => onSelectTier(tier.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded transition-all duration-300 font-mono text-sm uppercase tracking-wider border",
                                isSelected
                                    ? `bg-white/5 ${tier.border} ${tier.color} shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                                    : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tier.name}
                        </button>
                    );
                })}
            </div>

            {/* Technical readout line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent mt-4" />
            <div className="flex justify-between text-[10px] font-mono text-cyan-900 mt-1 px-2">
                <span>SYS.ID: {selectedTier.toUpperCase()}_PROTO_V2</span>
                <span>STATUS: ACTIVE</span>
            </div>
        </div>
    );
};

export default ControlDeck;
