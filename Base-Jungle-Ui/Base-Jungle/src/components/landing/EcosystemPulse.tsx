import React from 'react';

const EcosystemPulse: React.FC = () => {
    return (
        <div className="w-full bg-[#020202] border-y border-gray-900 overflow-hidden py-3">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-mono text-blue-400">
                <span>TOTAL VALUE LOCKED: $12,405,000</span>
                <span className="text-gray-700">///</span>
                <span>POINTS GENERATED: 45,000,000</span>
                <span className="text-gray-700">///</span>
                <span>CURRENT BEST APY: 14.2% (Aerodrome)</span>
                <span className="text-gray-700">///</span>
                <span>NEXT HARVEST IN: 04h 12m</span>
                <span className="text-gray-700">///</span>
                <span>SYSTEM STATUS: OPERATIONAL</span>
                <span className="text-gray-700">///</span>
                {/* Duplicate for seamless loop */}
                <span>TOTAL VALUE LOCKED: $12,405,000</span>
                <span className="text-gray-700">///</span>
                <span>POINTS GENERATED: 45,000,000</span>
                <span className="text-gray-700">///</span>
                <span>CURRENT BEST APY: 14.2% (Aerodrome)</span>
                <span className="text-gray-700">///</span>
                <span>NEXT HARVEST IN: 04h 12m</span>
                <span className="text-gray-700">///</span>
                <span>SYSTEM STATUS: OPERATIONAL</span>
            </div>
        </div>
    );
};

export default EcosystemPulse;
