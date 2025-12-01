import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { motion } from 'framer-motion';

const data = [
    { date: 'Nov 01', tvl: 4000, benchmark: 3000, yield: 240 },
    { date: 'Nov 05', tvl: 5500, benchmark: 3200, yield: 400 },
    { date: 'Nov 10', tvl: 7000, benchmark: 3500, yield: 800 },
    { date: 'Nov 15', tvl: 6800, benchmark: 3400, yield: 1200 }, // Dip
    { date: 'Nov 20', tvl: 9000, benchmark: 3800, yield: 1800 },
    { date: 'Nov 25', tvl: 11000, benchmark: 4000, yield: 2500 },
    { date: 'Dec 01', tvl: 12450, benchmark: 4200, yield: 3200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#050505] border border-gray-800 p-3 rounded-lg shadow-xl">
                <p className="text-gray-400 text-xs mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300">{entry.name}:</span>
                        <span className="font-mono font-bold text-white">
                            {entry.name.includes('Yield') ? '$' : '$'}{entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CanopyGrowthChart: React.FC = () => {
    const [timeRange, setTimeRange] = useState('1M');

    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Canopy Growth Cycles
                        <span className="text-xs font-normal text-gray-500 border border-gray-800 px-2 py-0.5 rounded-full">
                            LIVE
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500">Protocol TVL vs Market Benchmark</p>
                </div>

                {/* Time Dilation Controls */}
                <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800">
                    {['1D', '1W', '1M', 'ALL'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range
                                    ? 'bg-[#0052FF] text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4B5563" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4B5563" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#4b5563"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#4b5563"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0052FF', strokeWidth: 1, strokeDasharray: '5 5' }} />

                        {/* Layer B: Benchmark (Dashed White) */}
                        <Area
                            type="monotone"
                            dataKey="benchmark"
                            name="Market Benchmark"
                            stroke="#9ca3af"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="transparent"
                        />

                        {/* Layer C: Yield (Gradient Fill) */}
                        <Area
                            type="monotone"
                            dataKey="yield"
                            name="Cumulative Yield"
                            stroke="#4b5563"
                            fillOpacity={1}
                            fill="url(#colorYield)"
                        />

                        {/* Layer A: TVL (Solid Blue) */}
                        <Area
                            type="monotone"
                            dataKey="tvl"
                            name="Jungle TVL"
                            stroke="#0052FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTvl)"
                        />

                        {/* Bot Marker Example */}
                        <ReferenceDot
                            x="Nov 15"
                            y={6800}
                            r={6}
                            fill="#0052FF"
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CanopyGrowthChart;
