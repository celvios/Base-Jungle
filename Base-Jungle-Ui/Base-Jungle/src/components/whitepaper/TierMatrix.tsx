import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TierData {
    name: string;
    minDeposit: string;
    withdrawalFee: string;
    strategies: string;
    pointsMultiplier: string;
    features: string[];
}

const tiers: TierData[] = [
    {
        name: 'Seedling',
        minDeposit: '$100',
        withdrawalFee: '2.0%',
        strategies: 'Conservative Only',
        pointsMultiplier: '1x',
        features: ['Basic Yield', 'Standard Support'],
    },
    {
        name: 'Sapling',
        minDeposit: '$1,000',
        withdrawalFee: '1.5%',
        strategies: 'Conservative + Moderate',
        pointsMultiplier: '1.2x',
        features: ['Enhanced Yield', 'Priority Support', 'Quarterly Reports'],
    },
    {
        name: 'Branch',
        minDeposit: '$10,000',
        withdrawalFee: '1.0%',
        strategies: 'All Strategies',
        pointsMultiplier: '1.5x',
        features: ['Max Yield', 'VIP Support', 'Monthly Reports', 'Early Access'],
    },
    {
        name: 'Canopy',
        minDeposit: '$100,000',
        withdrawalFee: '0.5%',
        strategies: 'All + Custom',
        pointsMultiplier: '2x',
        features: ['Custom Strategies', 'Dedicated Manager', 'Real-time Analytics', 'Governance Rights'],
    },
];

const TierMatrix: React.FC = () => {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-end space-x-2">
                <span className="text-xs text-gray-500 font-mono">VIEW:</span>
                <div className="flex bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'monthly'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        MONTHLY
                    </button>
                    <button
                        onClick={() => setViewMode('yearly')}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'yearly'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        YEARLY
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left py-3 px-4 text-xs font-mono text-gray-500 uppercase">Tier</th>
                            <th className="text-left py-3 px-4 text-xs font-mono text-gray-500 uppercase">Min Deposit</th>
                            <th className="text-left py-3 px-4 text-xs font-mono text-gray-500 uppercase">Withdrawal Fee</th>
                            <th className="text-left py-3 px-4 text-xs font-mono text-gray-500 uppercase">Strategies</th>
                            <th className="text-left py-3 px-4 text-xs font-mono text-gray-500 uppercase">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map((tier, index) => (
                            <motion.tr
                                key={tier.name}
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className={`border-b border-gray-800/50 transition-colors ${hoveredRow === index ? 'bg-blue-900/10' : ''
                                    }`}
                                animate={{
                                    opacity: hoveredRow === null || hoveredRow === index ? 1 : 0.4,
                                }}
                            >
                                <td className="py-4 px-4">
                                    <span className="font-bold text-blue-400">{tier.name}</span>
                                </td>
                                <td className="py-4 px-4 text-white">{tier.minDeposit}</td>
                                <td className="py-4 px-4 text-white">{tier.withdrawalFee}</td>
                                <td className="py-4 px-4 text-white">{tier.strategies}</td>
                                <td className="py-4 px-4">
                                    <span className="text-green-400 font-bold">{tier.pointsMultiplier}</span>
                                    {viewMode === 'yearly' && (
                                        <span className="text-xs text-gray-500 ml-2">(12x monthly)</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Features List for Hovered Tier */}
            {hoveredRow !== null && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gray-900/50 border border-blue-900/30 rounded-lg"
                >
                    <h4 className="text-sm font-bold text-blue-400 mb-2">{tiers[hoveredRow].name} Features:</h4>
                    <ul className="space-y-1">
                        {tiers[hoveredRow].features.map((feature, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center space-x-2">
                                <span className="text-blue-500">▸</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
};

export default TierMatrix;
