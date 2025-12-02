import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface DepositInterfaceProps {
    activeTier: any;
}

const DepositInterface: React.FC<DepositInterfaceProps> = ({ activeTier }) => {
    const handleTarget = () => {
        // In a real app, this would update a global context or scroll to a deposit section
        console.log(`Targeting tier: ${activeTier.name} with amount ${activeTier.price}`);
        // Dispatch custom event or callback
    };

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-black/80 backdrop-blur-md border border-blue-900/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,82,255,0.2)]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">Target Status</div>
                        <div className="text-2xl font-bold text-white">{activeTier.name}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">Required Deposit</div>
                        <div className="text-2xl font-mono text-blue-400">{activeTier.price}</div>
                    </div>
                </div>

                <Button
                    onClick={handleTarget}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-widest py-6 text-lg shadow-[0_0_20px_rgba(0,82,255,0.4)] transition-all hover:scale-[1.02]"
                >
                    Target This Tier <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="mt-3 text-center text-[10px] text-gray-500 font-mono">
                    INSTANTLY UNLOCKS {activeTier.lock} BENEFITS
                </div>
            </div>
        </div>
    );
};

export default DepositInterface;
