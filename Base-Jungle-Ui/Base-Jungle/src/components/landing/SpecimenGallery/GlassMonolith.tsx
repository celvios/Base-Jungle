import React from 'react';
import { motion } from 'framer-motion';

interface GlassMonolithProps {
    tier: any;
    isActive: boolean;
    onClick: () => void;
}

const GlassMonolith: React.FC<GlassMonolithProps> = ({ tier, isActive, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            className={`relative w-[300px] h-[500px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${isActive ? 'scale-110 z-10' : 'scale-95 opacity-40 hover:opacity-60'}`}
        >
            {/* Blue Obsidian Glass Material */}
            <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[40px] border border-white/10 shadow-[0_0_30px_rgba(0,82,255,0.1)]" />

            {/* Content Container */}
            <div className="relative h-full p-8 flex flex-col justify-end">
                {/* Top Light Source Reflection */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent" />

                <div className="space-y-4">
                    <div>
                        <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">Specimen 0{tier.id}</div>
                        <h3 className="text-4xl font-bold text-white">{tier.name}</h3>
                    </div>

                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-mono uppercase">Entry</span>
                            <span className="text-sm font-bold text-white">{tier.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-mono uppercase">Multiplier</span>
                            <span className="text-sm font-bold text-blue-300">{tier.multiplier}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-mono uppercase">Leverage</span>
                            <span className="text-sm font-bold text-purple-300">{tier.leverage}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GlassMonolith;
