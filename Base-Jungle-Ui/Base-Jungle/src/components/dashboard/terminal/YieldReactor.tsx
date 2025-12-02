import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface YieldReactorProps {
    balance: number;
    dailyPnL: number;
    data: any[]; // Chart data
}

const YieldReactor: React.FC<YieldReactorProps> = ({ balance, dailyPnL, data }) => {
    return (
        <div className="col-span-1 md:col-span-2 row-span-2 relative bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex flex-col">

            {/* Header Data */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start z-10">
                <div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Total Yield Balance</div>
                    <div className="text-4xl font-bold font-mono text-white tracking-tight">
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-mono text-green-400 flex items-center gap-1">
                            +${dailyPnL.toFixed(2)} (24h)
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono uppercase">Auto-Compounding Active</span>
                    </div>
                </div>

                {/* Pulsing Tube Indicator */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1.5 h-16 bg-black/50 rounded-full border border-white/10 overflow-hidden relative">
                        <motion.div
                            animate={{ height: ["0%", "100%", "0%"], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-0 w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        />
                    </div>
                    <span className="text-[9px] font-mono text-blue-500 uppercase">Pulse</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full h-full min-h-[250px] relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorYield)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default YieldReactor;
