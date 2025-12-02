import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationMatrixProps {
    selectedTier: string;
}

const AllocationMatrix: React.FC<AllocationMatrixProps> = ({ selectedTier }) => {
    const getData = () => {
        switch (selectedTier) {
            case 'sprout':
                return [
                    { name: 'USDC (Stable)', value: 100, color: '#22c55e' }
                ];
            case 'tree':
                return [
                    { name: 'AERO (Volatile)', value: 50, color: '#06b6d4' },
                    { name: 'USDC (Stable)', value: 50, color: '#22c55e' }
                ];
            default:
                return [
                    { name: 'AERO (Long)', value: 40, color: '#06b6d4' },
                    { name: 'AERO (Short)', value: 40, color: '#ef4444' },
                    { name: 'USDC (Buffer)', value: 20, color: '#22c55e' }
                ];
        }
    };

    const data = getData();

    return (
        <div className="bg-[#0a0a0a] border border-cyan-900/30 rounded-xl p-6 relative">
            <h3 className="text-cyan-500 font-mono text-sm mb-4">ALLOCATION MATRIX</h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Chart */}
                <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-xs font-mono text-gray-500">ASSET<br />DIST</div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between border-b border-gray-800 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-mono text-gray-300">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-white font-mono">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllocationMatrix;
