import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Circle } from 'lucide-react';

interface RoadmapPhase {
    id: string;
    title: string;
    status: 'completed' | 'current' | 'future';
    date: string;
    items: string[];
    details?: string; // Extra details for expandable nodes
}

const phases: RoadmapPhase[] = [
    {
        id: 'phase-1',
        title: 'Phase 1: Protocol Launch',
        status: 'completed',
        date: 'COMPLETED',
        items: [
            'Smart contract deployment',
            'Security audit (CertiK)',
            'Delta Neutral Farming Strategy',
            'Frontend v1 Launch'
        ]
    },
    {
        id: 'phase-2',
        title: 'Phase 2: Growth & Optimization',
        status: 'current',
        date: 'CURRENT',
        items: [
            'Liquidity Bootstrapping Event',
            'Advanced Keeper Automation',
            'Points Program & Referrals',
            'Strategic Partnerships'
        ]
    },
    {
        id: 'phase-3',
        title: 'Phase 3: Expansion',
        status: 'future',
        date: 'Q2 2025',
        items: [
            'Cross-chain expansion (Arbitrum, Optimism)',
            'DAO Governance Launch',
            'Mobile App Release',
            'Institutional Vaults'
        ],
        details: 'We plan to deploy on Arbitrum and Optimism to tap into deeper liquidity. The DAO will transition control of the Strategy Controller to token holders. The mobile app will feature biometric auth and push notifications for harvest events.'
    },
    {
        id: 'phase-4',
        title: 'Phase 4: The Jungle Ecosystem',
        status: 'future',
        date: 'Q4 2025',
        items: [
            'Jungle Launchpad',
            'Native Stablecoin (jUSD)',
            'AI-Driven Strategy Optimization'
        ],
        details: 'The Jungle Launchpad will allow new Base projects to bootstrap liquidity using our vaults. jUSD will be a delta-neutral stablecoin backed by vault positions. AI agents will dynamically adjust risk parameters in real-time.'
    }
];

const RoadmapTimeline: React.FC = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="relative pl-8 border-l-2 border-gray-800 space-y-12">
            {phases.map((phase, index) => {
                const isFuture = phase.status === 'future';
                const isExpanded = expandedId === phase.id;

                return (
                    <div key={phase.id} className="relative">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-[#050505] flex items-center justify-center z-10
              ${phase.status === 'completed' ? 'bg-green-500' :
                                phase.status === 'current' ? 'bg-blue-500 shadow-[0_0_10px_#0052FF]' : 'bg-gray-700'}`}
                        >
                            {/* Inner dot for future nodes to make them look interactive if they have details */}
                            {isFuture && phase.details && (
                                <div className="w-1 h-1 bg-white rounded-full" />
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <div
                                className={`flex items-center justify-between mb-2 ${isFuture && phase.details ? 'cursor-pointer group' : ''}`}
                                onClick={() => isFuture && phase.details && toggleExpand(phase.id)}
                            >
                                <div className="flex items-center space-x-3">
                                    <h3 className={`text-xl font-bold ${phase.status === 'completed' ? 'text-green-400' :
                                            phase.status === 'current' ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200 transition-colors'
                                        }`}>
                                        {phase.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded font-mono ${phase.status === 'completed' ? 'text-green-500 bg-green-900/20' :
                                            phase.status === 'current' ? 'text-blue-500 bg-blue-900/20' : 'text-gray-500 bg-gray-900/20'
                                        }`}>
                                        {phase.date}
                                    </span>
                                </div>

                                {/* Expand Icon for Future Nodes */}
                                {isFuture && phase.details && (
                                    <div className="text-gray-500 group-hover:text-white transition-colors">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                )}
                            </div>

                            {/* List Items */}
                            <ul className="space-y-2 mb-4">
                                {phase.items.map((item, i) => (
                                    <li key={i} className="flex items-start space-x-2 text-sm text-gray-400">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-600" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && phase.details && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-lg text-sm text-gray-400 leading-relaxed">
                                            <p>{phase.details}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RoadmapTimeline;
