import React from 'react';
import { Snowflake, Lock, Settings, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const FutureBallot: React.FC = () => {
    const cards = [
        {
            id: 1,
            title: 'Strategy Whitelisting',
            description: 'Token holders will vote to add new protocols (e.g., Compound, Sushi).',
            unlocks: 'Phase 2',
            icon: Settings
        },
        {
            id: 2,
            title: 'Fee Gauge',
            description: 'Token holders will vote on the Protocol Fee rate (currently fixed at 15%).',
            unlocks: 'Phase 3',
            icon: Percent
        }
    ];

    return (
        <div className="w-full mb-12">
            <h2 className="text-xl font-bold font-mono text-gray-500 mb-6 flex items-center gap-2">
                <Snowflake className="w-5 h-5" />
                FUTURE BALLOT INITIATIVES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.id}
                            className="relative bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 overflow-hidden group cursor-not-allowed"
                            whileHover={{ scale: 1.01 }}
                        >
                            {/* Frost Effect Overlay */}
                            <div className="absolute inset-0 bg-blue-100/5 backdrop-blur-[1px] group-hover:backdrop-blur-none group-hover:bg-transparent transition-all duration-700 pointer-events-none z-10" />
                            <div className="absolute top-0 right-0 p-4 z-20">
                                <div className="flex items-center gap-1 text-[10px] font-mono text-blue-300 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/30">
                                    <Lock className="w-3 h-3" />
                                    LOCKED ({card.unlocks})
                                </div>
                            </div>

                            <div className="relative z-0 opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4 border border-gray-800">
                                    <Icon className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{card.description}</p>
                            </div>

                            {/* Ice Crystals (Decorative) */}
                            <div className="absolute bottom-0 right-0 opacity-20 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none">
                                <Snowflake className="w-24 h-24 text-blue-200 transform rotate-12 translate-x-8 translate-y-8" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default FutureBallot;
