import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface TokenAllocation {
    name: string;
    value: number;
    color: string;
    tokens: string;
}

const data: TokenAllocation[] = [
    { name: 'Community Rewards', value: 40, color: '#0052FF', tokens: '4,000,000' },
    { name: 'Treasury', value: 20, color: '#0066CC', tokens: '2,000,000' },
    { name: 'Team & Advisors', value: 15, color: '#0080FF', tokens: '1,500,000' },
    { name: 'Liquidity', value: 15, color: '#3399FF', tokens: '1,500,000' },
    { name: 'Marketing', value: 10, color: '#66B3FF', tokens: '1,000,000' },
];

const TokenomicsPie: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Chart */}
            <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={activeIndex !== null ? 90 : 80}
                            paddingAngle={2}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    style={{
                                        filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(0, 82, 255, 0.6))' : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Display */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        {activeIndex !== null ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-1"
                            >
                                <div className="text-2xl font-bold text-blue-400 font-mono">
                                    {data[activeIndex].value}%
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                    {data[activeIndex].tokens}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-white font-mono">10M</div>
                                <div className="text-xs text-gray-500">TOTAL JUNGLE</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
                {data.map((entry, index) => (
                    <button
                        key={entry.name}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        className={`flex items-center space-x-3 p-2 rounded transition-colors ${activeIndex === index ? 'bg-blue-900/20' : 'hover:bg-gray-900/50'
                            }`}
                    >
                        <div
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                        />
                        <div className="text-left">
                            <div className="text-sm font-bold text-white">{entry.name}</div>
                            <div className="text-xs text-gray-500 font-mono">
                                {entry.value}% • {entry.tokens} tokens
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TokenomicsPie;
