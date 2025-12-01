import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PulseMap: React.FC = () => {
    const [lastHeartbeat, setLastHeartbeat] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLastHeartbeat(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Reset heartbeat counter every 5s when the pulse happens
    useEffect(() => {
        const interval = setInterval(() => {
            setLastHeartbeat(0);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const satellites = [
        { id: 'aerodrome', label: 'Aerodrome', x: 20, y: 30 },
        { id: 'aave', label: 'Aave', x: 80, y: 30 },
        { id: 'moonwell', label: 'Moonwell', x: 20, y: 70 },
        { id: 'beefy', label: 'Beefy', x: 80, y: 70 },
        { id: 'pyth', label: 'Pyth Oracle', x: 50, y: 85 },
    ];

    return (
        <div className="relative w-full h-80 bg-[#080808] border border-blue-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,82,255,0.05)]">
            {/* Overlay Data */}
            <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#0052FF]" />
                    <span className="text-xs font-mono text-blue-400 tracking-widest">NETWORK STATUS: OPERATIONAL</span>
                </div>
                <div className="text-[10px] font-mono text-gray-500 pl-4">
                    LAST HEARTBEAT: {lastHeartbeat}s AGO
                </div>
            </div>

            {/* Map SVG */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#0052FF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Central Node: Master Vault */}
                <circle cx="50" cy="50" r="15" fill="url(#centerGlow)" className="animate-pulse" />
                <circle cx="50" cy="50" r="3" fill="#0052FF" className="drop-shadow-[0_0_10px_#0052FF]" />
                <text x="50" y="45" textAnchor="middle" fill="#fff" fontSize="3" className="font-mono opacity-80">MASTER VAULT</text>

                {/* Connections & Satellites */}
                {satellites.map((sat) => (
                    <g key={sat.id}>
                        {/* Connection Line */}
                        <line
                            x1="50"
                            y1="50"
                            x2={sat.x}
                            y2={sat.y}
                            stroke="#1a1a1a"
                            strokeWidth="0.5"
                        />

                        {/* Pulse Animation */}
                        <motion.circle
                            r="1"
                            fill="#0052FF"
                            initial={{ cx: 50, cy: 50, opacity: 0 }}
                            animate={{
                                cx: [50, sat.x, 50],
                                cy: [50, sat.y, 50],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear",
                                times: [0, 0.5, 1]
                            }}
                        />

                        {/* Satellite Node */}
                        <circle cx={sat.x} cy={sat.y} r="2" fill="#111" stroke="#333" strokeWidth="0.5" />
                        <text x={sat.x} y={sat.y + 5} textAnchor="middle" fill="#666" fontSize="2.5" className="font-mono uppercase">{sat.label}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default PulseMap;
