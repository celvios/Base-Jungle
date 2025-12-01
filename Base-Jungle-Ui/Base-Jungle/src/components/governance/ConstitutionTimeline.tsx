import React from 'react';
import { Shield, Lock, Vote, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const ConstitutionTimeline: React.FC = () => {
    const phases = [
        {
            id: 1,
            title: 'Guardian Era',
            subtitle: 'Multisig Control + Timelock',
            status: 'active',
            icon: Shield,
            color: 'text-blue-500',
            borderColor: 'border-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 2,
            title: 'Hybrid Era',
            subtitle: 'Token Voting / Veto Power',
            status: 'locked',
            icon: Vote,
            color: 'text-gray-500',
            borderColor: 'border-gray-800',
            bg: 'bg-gray-900/50'
        },
        {
            id: 3,
            title: 'DAO Era',
            subtitle: 'Full On-Chain Autonomy',
            status: 'locked',
            icon: Globe,
            color: 'text-gray-500',
            borderColor: 'border-gray-800',
            bg: 'bg-gray-900/50'
        }
    ];

    return (
        <div className="w-full mb-12">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-mono text-white mb-2 tracking-tighter">THE CONSTITUTION</h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    Governance is currently managed by the Guardian Council (5-of-9 Multisig) subject to a 48-Hour Public Timelock.
                </p>
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2 hidden md:block" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {phases.map((phase) => {
                        const Icon = phase.icon;
                        const isActive = phase.status === 'active';

                        return (
                            <motion.div
                                key={phase.id}
                                className={`relative p-6 rounded-xl border ${isActive ? 'border-blue-500 bg-black shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-gray-800 bg-[#0a0a0a]'} overflow-hidden group`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: phase.id * 0.1 }}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                                )}

                                <div className="flex flex-col items-center text-center relative z-10">
                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-4 ${isActive ? 'border-blue-500 bg-blue-950 text-blue-400' : 'border-gray-700 bg-gray-900 text-gray-600'}`}>
                                        {phase.status === 'locked' ? <Lock className="w-5 h-5" /> : <Icon className="w-6 h-6" />}
                                    </div>

                                    <div className="text-xs font-mono uppercase tracking-widest mb-1 text-gray-500">Phase 0{phase.id}</div>
                                    <h3 className={`text-lg font-bold font-mono mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>{phase.title}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{phase.subtitle}</p>

                                    {isActive && (
                                        <div className="mt-4 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                            Current System
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ConstitutionTimeline;
