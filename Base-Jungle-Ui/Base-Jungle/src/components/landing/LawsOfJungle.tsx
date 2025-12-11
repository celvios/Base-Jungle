import React from 'react';
import { Settings, Star, TrendingUp, ShieldCheck } from 'lucide-react';

const LawsOfJungle: React.FC = () => {
    const features = [
        {
            id: 1,
            title: 'Zero Manual Actions',
            desc: 'Deposit once. The protocol auto-compounds, auto-rebalances, and auto-harvests without you lifting a finger.',
            icon: Settings,
            color: 'text-blue-400'
        },
        {
            id: 2,
            title: 'Points System',
            desc: 'Every on-chain action earns points. Points convert 1:1 to JUNGLE tokens at the Token Generation Event.',
            icon: Star,
            color: 'text-yellow-400'
        },
        {
            id: 3,
            title: 'Tiered Leverage',
            desc: 'Unlock up to 5x leverage on stablecoin strategies by upgrading your Species Tier.',
            icon: TrendingUp,
            color: 'text-green-400'
        },
        {
            id: 4,
            title: 'Hardcoded Safety',
            desc: '0.5% max slippage limits, 48-hour governance timelock, and 5-of-9 Multisig protection.',
            icon: ShieldCheck,
            color: 'text-cyan-400'
        }
    ];

    return (
        <section className="py-24 px-4 md:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-bold font-mono text-white mb-12 text-center">THE LAWS OF THE JUNGLE</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.id} className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl overflow-hidden transition-all hover:border-blue-500/30">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                    <Icon className={`w-32 h-32 ${feature.color}`} />
                                </div>

                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center mb-6 group-hover:border-blue-500/30 transition-colors`}>
                                        <Icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                    <p className="text-gray-400 leading-relaxed max-w-md">{feature.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default LawsOfJungle;
