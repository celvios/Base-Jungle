import React from 'react';
import { Button } from '@/components/ui/button';
import { Sprout, ArrowRight } from 'lucide-react';

interface HarvestStationProps {
    pendingRewards: number;
    totalRewards: number;
    onClaim: () => void;
}

const HarvestStation: React.FC<HarvestStationProps> = ({ pendingRewards, totalRewards, onClaim }) => {
    return (
        <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/30 rounded-2xl p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sprout className="w-24 h-24 text-blue-500" />
            </div>

            <h3 className="text-lg font-bold text-white font-mono tracking-wider mb-6">HARVEST STATION</h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <div className="text-xs text-gray-500 font-mono uppercase mb-1">Pending Rewards</div>
                    <div className="text-3xl font-bold text-white">{pendingRewards.toLocaleString()}</div>
                    <div className="text-xs text-blue-400 font-mono">PTS</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 font-mono uppercase mb-1">Total Harvested</div>
                    <div className="text-3xl font-bold text-gray-400">{totalRewards.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 font-mono">PTS</div>
                </div>
            </div>

            <Button
                onClick={onClaim}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 group"
                disabled={pendingRewards === 0}
            >
                {pendingRewards > 0 ? 'EXTRACT BIOMASS' : 'NO BIOMASS DETECTED'}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );
};

export default HarvestStation;
