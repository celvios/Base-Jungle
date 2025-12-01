import React from 'react';
import { motion } from 'framer-motion';

const FoodChain: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-white">The Food Chain</h3>
                    <p className="text-sm text-gray-500">Tier Distribution</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Whale Dominance</div>
                    <div className="text-white font-mono">40% TVL</div>
                </div>
            </div>

            {/* DNA Bar */}
            <div className="h-12 w-full flex rounded-lg overflow-hidden border border-gray-800">
                {/* Sprout */}
                <div className="h-full bg-blue-900/30 w-[20%] relative group border-r border-gray-800">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-300 font-bold">Sprout</div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                </div>

                {/* Tree */}
                <div className="h-full bg-blue-700/40 w-[35%] relative group border-r border-gray-800">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-200 font-bold">Tree</div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                </div>

                {/* Forest */}
                <div className="h-full bg-[#0052FF] w-[45%] relative group">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">Forest</div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-black border border-gray-700 p-2 rounded text-xs text-white whitespace-nowrap z-10">
                        Whales: 5% of Users control 40% of TVL
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-3 text-xs text-gray-500 font-mono">
                <span>$100+</span>
                <span>$3,600+</span>
                <span>$14,400+</span>
            </div>
        </div>
    );
};

export default FoodChain;
