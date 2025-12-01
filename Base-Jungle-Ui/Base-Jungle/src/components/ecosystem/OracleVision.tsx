import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const OracleVision: React.FC = () => {
    const [chainlinkPrice, setChainlinkPrice] = useState(3450.20);
    const [pythPrice, setPythPrice] = useState(3450.25);
    const [deviation, setDeviation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate small price fluctuations
            const newChainlink = 3450 + (Math.random() * 2 - 1);
            const newPyth = newChainlink + (Math.random() * 0.5 - 0.25); // Pyth is usually very close

            setChainlinkPrice(newChainlink);
            setPythPrice(newPyth);
            setDeviation(Math.abs((newChainlink - newPyth) / newChainlink) * 100);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const isSafe = deviation < 1;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Panel A: Chainlink Feed */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-gray-400">CHAINLINK</span>
                    </div>
                    <span className="text-[10px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">SYNCED</span>
                </div>
                <div className="text-2xl font-mono text-white">${chainlinkPrice.toFixed(2)}</div>
                <div className="text-[10px] text-gray-600 mt-1">Source: Aggregator V3</div>
            </div>

            {/* Panel B: Pyth Network */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold text-gray-400">PYTH</span>
                    </div>
                    <span className="text-[10px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">SYNCED</span>
                </div>
                <div className="text-2xl font-mono text-white">${pythPrice.toFixed(2)}</div>
                <div className="text-[10px] text-gray-600 mt-1">Source: Pyth Oracle</div>
            </div>

            {/* Panel C: Deviation Check */}
            <motion.div
                className={`bg-[#0a0a0a] border rounded-lg p-4 relative overflow-hidden transition-colors ${isSafe ? 'border-blue-900/50' : 'border-red-500 animate-pulse'}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        {isSafe ? <CheckCircle className="w-4 h-4 text-blue-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span className="text-xs font-bold text-gray-400">DEVIATION</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSafe ? 'text-blue-500 bg-blue-900/20' : 'text-red-500 bg-red-900/20'}`}>
                        {isSafe ? 'SAFE' : 'WARNING'}
                    </span>
                </div>
                <div className="text-2xl font-mono text-white">{deviation.toFixed(4)}%</div>
                <div className="text-[10px] text-gray-600 mt-1">Threshold: 1.0%</div>

                {/* Glitch Overlay if unsafe */}
                {!isSafe && (
                    <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay pointer-events-none" />
                )}
            </motion.div>
        </div>
    );
};

export default OracleVision;
