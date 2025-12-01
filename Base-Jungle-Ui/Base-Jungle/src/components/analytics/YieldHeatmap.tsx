import React from 'react';

const YieldHeatmap: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 h-full">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">The Yield Heatmap</h3>
                <p className="text-sm text-gray-500">Strategy Performance & Allocation</p>
            </div>
            <div className="h-[300px] w-full flex items-center justify-center text-gray-400">
                Heatmap visualization coming soon...
            </div>
        </div>
    );
};

export default YieldHeatmap;
