import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

const InsuranceFund: React.FC = () => {
    return (
        <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            {/* Safe Visual (Abstract) */}
            <div className="w-32 h-32 bg-gray-900 rounded-xl border-4 border-gray-700 relative flex items-center justify-center shadow-2xl">
                <div className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-gray-500" />
                </div>
                {/* Glow from ajar door */}
                <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
            </div>

            <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white font-mono mb-2">INSURANCE FUND</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-black border border-gray-800 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase font-mono">Coverage Provider</div>
                        <div className="text-sm font-bold text-white">NEXUS MUTUAL</div>
                    </div>
                    <div className="bg-black border border-gray-800 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase font-mono">Active Policy</div>
                        <div className="text-sm font-bold text-cyan-400">#88219</div>
                    </div>
                    <div className="bg-black border border-gray-800 p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 uppercase font-mono">Coverage Amount</div>
                        <div className="text-sm font-bold text-green-400">$5,000,000</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsuranceFund;
