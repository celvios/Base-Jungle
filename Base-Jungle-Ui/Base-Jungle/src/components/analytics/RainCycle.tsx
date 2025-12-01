import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const RainCycle: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">The Rain Cycle</h3>
                <p className="text-sm text-gray-500">Revenue & Buybacks</p>
            </div>

            <div className="relative h-[160px] flex items-center justify-between px-4">

                {/* Source: Fees */}
                <div className="flex flex-col items-center z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-[#0052FF] flex items-center justify-center bg-blue-900/20">
                        <span className="text-xs font-bold text-blue-300">FEES</span>
                    </div>
                </div>

                {/* Flow Lines */}
                <div className="absolute inset-0 flex items-center px-12">
                    <div className="h-1 w-full bg-gray-800 relative overflow-hidden rounded-full">
                        <motion.div
                            className="absolute inset-0 bg-[#0052FF]"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                    </div>
                </div>

                {/* Treasury (Turbine) */}
                <div className="flex flex-col items-center z-10">
                    <div className="w-20 h-20 rounded-lg border-2 border-white/20 flex items-center justify-center bg-gray-900 rotate-45">
                        <div className="-rotate-45 text-center">
                            <div className="text-[10px] text-gray-400">TREASURY</div>
                            <div className="font-mono font-bold text-white">$45k</div>
                        </div>
                    </div>
                </div>

                {/* Output: Incinerator */}
                <div className="flex flex-col items-center z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-orange-500/50 flex items-center justify-center bg-orange-900/10 relative overflow-hidden">
                        <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                    <div className="mt-2 text-center">
                        <div className="text-[10px] text-orange-400">TOTAL BURNED</div>
                        <div className="font-mono font-bold text-white text-sm">45,000</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RainCycle;
