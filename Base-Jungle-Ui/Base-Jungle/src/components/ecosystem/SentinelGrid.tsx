import React from 'react';
import { motion } from 'framer-motion';
import { Radar, Scale, Scissors, ShieldCheck } from 'lucide-react';

// Card 1: The Scanner (Sonar Animation)
const ScannerCard = () => (
    <div className="relative p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
                <Radar className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-gray-300">SCANNER</span>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">ACTIVE</span>
        </div>

        <div className="relative h-24 flex items-center justify-center">
            {/* Sonar Rings */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute border border-blue-500/30 rounded-full"
                    initial={{ width: 0, height: 0, opacity: 1 }}
                    animate={{ width: '100%', height: '100%', opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
            ))}
            <div className="z-10 text-center">
                <div className="text-2xl font-bold text-white">12%</div>
                <div className="text-[10px] text-gray-500 uppercase">APY Found</div>
            </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-gray-600">Target: Moonwell</div>
    </div>
);

// Card 2: The Rebalancer (Level Bubble Animation)
const RebalancerCard = () => (
    <div className="relative p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-300">REBALANCER</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 bg-gray-900/20 px-2 py-0.5 rounded">STANDBY</span>
        </div>

        <div className="h-24 flex flex-col justify-center space-y-4">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>SPREAD</span>
                <span className="text-white">0.2%</span>
            </div>
            {/* Level Bubble */}
            <div className="relative w-full h-4 bg-gray-900 rounded-full border border-gray-800 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-0.5 h-full bg-gray-700 -translate-x-1/2 -translate-y-1/2" /> {/* Center Marker */}
                <motion.div
                    className="absolute top-0 bottom-0 w-8 bg-blue-500/50 rounded-full shadow-[0_0_10px_#0052FF]"
                    animate={{ left: ["45%", "55%", "48%", "52%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            <div className="text-[10px] text-gray-600 text-center">Threshold: 0.5%</div>
        </div>
    </div>
);

// Card 3: The Harvester (Progress Ring)
const HarvesterCard = () => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="relative p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                    <Scissors className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-bold text-gray-300">HARVESTER</span>
                </div>
                <span className="text-[10px] font-mono text-yellow-500/80 bg-yellow-900/20 px-2 py-0.5 rounded">SCHEDULED</span>
            </div>

            <div className="h-24 flex items-center justify-center relative">
                <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r={radius} stroke="#1a1a1a" strokeWidth="4" fill="transparent" />
                    <motion.circle
                        cx="40" cy="40" r={radius}
                        stroke="#eab308"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * 0.2 }} // 80% full
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute text-center">
                    <div className="text-sm font-bold text-white">04:32</div>
                    <div className="text-[8px] text-gray-500 uppercase">Next Run</div>
                </div>
            </div>
        </div>
    );
};

// Card 4: The Guardian (EKG Animation)
const GuardianCard = () => (
    <div className="relative p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-bold text-gray-300">GUARDIAN</span>
            </div>
            <span className="text-[10px] font-mono text-green-500/80 bg-green-900/20 px-2 py-0.5 rounded">VIGILANT</span>
        </div>

        <div className="h-24 flex flex-col justify-center">
            <div className="relative w-full h-12 bg-gray-900/30 rounded overflow-hidden flex items-center">
                {/* EKG Line */}
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <motion.path
                        d="M0,25 L10,25 L15,10 L20,40 L25,25 L40,25 L45,15 L50,35 L55,25 L100,25"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1, x: [-100, 0] }}
                        transition={{
                            pathLength: { duration: 0.5, repeat: Infinity, repeatType: "loop", ease: "linear" },
                            x: { duration: 2, repeat: Infinity, ease: "linear" }
                        }}
                    />
                </svg>
            </div>
            <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] text-gray-500">LIQUIDATION RISK</span>
                <span className="text-xs font-bold text-green-500">NONE</span>
            </div>
        </div>
    </div>
);

const SentinelGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScannerCard />
            <RebalancerCard />
            <HarvesterCard />
            <GuardianCard />
        </div>
    );
};

export default SentinelGrid;
