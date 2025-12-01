import React from 'react';
import { AlertOctagon, User } from 'lucide-react';

const EmergencyOverride: React.FC = () => {
    return (
        <div className="w-full bg-red-950/10 border border-red-900/30 rounded-xl p-6 mb-8 relative overflow-hidden">
            {/* "Break Glass" Aesthetic */}
            <div className="absolute top-0 right-0 p-2 bg-red-900/20 rounded-bl-xl border-b border-l border-red-500/20 text-[10px] text-red-500 font-mono font-bold uppercase">
                Emergency Protocol
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertOctagon className="w-8 h-8 text-red-500" />
                        <h3 className="text-xl font-bold text-white font-mono">EMERGENCY OVERRIDE</h3>
                    </div>
                    <p className="text-sm text-gray-400 font-mono leading-relaxed">
                        In the event of a black swan or critical vulnerability, the Guardian Multisig has the power to freeze all deposits and pause protocol interactions to protect user funds.
                    </p>
                </div>

                <div className="flex-1 w-full bg-black/50 rounded-lg p-4 border border-red-900/20">
                    <div className="text-xs text-red-400 font-mono uppercase mb-3 text-center">5 Signatures Required to Execute</div>
                    <div className="flex justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded bg-red-900/20 border border-red-500/30 flex items-center justify-center">
                                <User className="w-4 h-4 text-red-500 animate-pulse" />
                            </div>
                        ))}
                        {[...Array(4)].map((_, i) => (
                            <div key={i + 5} className="w-8 h-8 rounded bg-gray-900 border border-gray-800 flex items-center justify-center opacity-50">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyOverride;
