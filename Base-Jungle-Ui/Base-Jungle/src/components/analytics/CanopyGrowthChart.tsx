import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Maximize2, Info, Bot } from 'lucide-react';

const data = [
    { date: 'Nov 01', tvl: 4000, market: 2400, yield: 240 },
    { date: 'Nov 05', tvl: 3000, market: 1398, yield: 221 },
    { date: 'Nov 10', tvl: 2000, market: 9800, yield: 229 },
    { date: 'Nov 15', tvl: 2780, market: 3908, yield: 200 },
    { date: 'Nov 20', tvl: 1890, market: 4800, yield: 218 },
    { date: 'Nov 25', tvl: 2390, market: 3800, yield: 250 },
    { date: 'Nov 30', tvl: 3490, market: 4300, yield: 210 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg shadow-xl">
                <p className="text-gray-400 text-xs mb-2 font-mono">{label}</p>
                <div className="space-y-1">
                    <p className="text-[#0052FF] text-sm font-bold">
                        TVL: ${payload[0].value.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                        Market: ${payload[1].value.toLocaleString()}
                    </p>
                    <p className="text-emerald-400 text-xs">
                        Yield: +${payload[2].value}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CanopyGrowthChart: React.FC = () => {
    const [timeRange, setTimeRange] = useState('1M');

    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                        Canopy Growth
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">PROTOCOL TVL vs MARKET BENCHMARK</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800">
                        {['1W', '1M', '3M', 'ALL'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === range
                                        ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-900/20'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
                            </linearGradient>
                            <pattern id="patternMarket" patternUnits="userSpaceOnUse" width="4" height="4">
                                <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="#333" strokeWidth="1" />
                            </pattern>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#333"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#333"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0052FF', strokeWidth: 1, strokeDasharray: '4 4' }} />

                        {/* Market Benchmark (Dashed/Pattern) */}
                        <Area
                            type="monotone"
                            dataKey="market"
                            stroke="#444"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fill="url(#patternMarket)"
                        />

                        {/* Protocol TVL (Main) */}
                        <Area
                            type="monotone"
                            dataKey="tvl"
                            stroke="#0052FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTvl)"
                        />

                        {/* Yield Overlay (Gradient) */}
                        <Area
                            type="monotone"
                            dataKey="yield"
                            stroke="none"
                            fill="#10b981"
                            fillOpacity={0.1}
                        />

                        {/* Bot Activity Marker */}
                        <ReferenceDot
                            x="Nov 15"
                            y={6800}
                            r={6}
                            fill="#0052FF"
                            stroke="#fff"
                            strokeWidth={2}
                        >
                            <Bot className="w-3 h-3 text-white absolute -top-1 -left-1" />
                        </ReferenceDot>

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer / Legend */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#0052FF]" />
                        <span className="text-xs text-gray-400">Base Jungle TVL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-dashed border-gray-500" />
                        <span className="text-xs text-gray-400">Market Benchmark</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Info className="w-3 h-3" />
                    <span>Last updated: 12s ago</span>
                </div>
            </div>
        </div>
    );
};

export default CanopyGrowthChart;
