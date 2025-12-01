import React from 'react';
import { Settings, Clock, Droplets, ShieldAlert } from 'lucide-react';

const DefenseParameters: React.FC = () => {
    const params = [
        {
            id: 1,
            title: 'Slippage Protection',
            value: '0.5%',
            context: 'Transactions revert if price impact exceeds limit.',
            icon: Settings,
            type: 'switch'
        },
        {
            id: 2,
            title: 'Governance Timelock',
            value: '48 HOURS',
            context: 'Critical upgrades require 2-day public notice.',
            icon: Clock,
            type: 'timer'
        },
        {
            id: 3,
            title: 'Diversification Cap',
            value: 'MAX 30%',
            context: 'Exposure cap per protocol to prevent single-point failure.',
            icon: Droplets,
            type: 'gauge'
        },
        {
            id: 4,
            title: 'Health Buffer',
            value: '15%',
            context: 'Liquidation safety margin.',
            icon: ShieldAlert,
            type: 'valve'
        }
    ];

    return (
        <div className="w-full mb-12">
            <h3 className="text-lg font-bold font-mono text-gray-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5" /> Defense Parameters (Immutable)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {params.map((param) => {
                    const Icon = param.icon;
                    return (
                        <div key={param.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-900/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Icon className="w-12 h-12 text-cyan-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">{param.title}</div>
                                <div className="text-2xl font-bold text-white font-mono mb-2">{param.value}</div>
                                <div className="text-[10px] text-gray-400 font-mono leading-relaxed border-t border-gray-800 pt-2 mt-2">
                                    {param.context}
                                </div>
                            </div>

                            {/* Visual Indicator (Abstract) */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                                <div className="h-full bg-cyan-500 w-full opacity-30" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DefenseParameters;
