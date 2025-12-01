import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';

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

            {/* Chart Placeholder */}
            <div className="h-[400px] w-full flex items-center justify-center text-gray-400">
                Chart visualization coming soon...
            </div>
        </div>
    );
};

export default CanopyGrowthChart;
