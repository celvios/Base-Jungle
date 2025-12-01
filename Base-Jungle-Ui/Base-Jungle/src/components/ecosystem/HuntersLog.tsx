import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

type LogType = 'SCANNER' | 'ORACLE' | 'REBALANCER' | 'TX';

interface LogEntry {
    id: string;
    timestamp: string;
    type: LogType;
    message: string;
    hash?: string;
    highlight?: boolean;
}

const INITIAL_LOGS: LogEntry[] = [
    { id: '1', timestamp: '14:02:05', type: 'SCANNER', message: 'Scanned 12 Pools. Best: Aerodrome vAMM-USDC/ETH (15.2%).', highlight: true },
    { id: '2', timestamp: '14:05:00', type: 'ORACLE', message: 'Price Update: ETH $3,450.20 (via Pyth).' },
    { id: '3', timestamp: '15:00:00', type: 'REBALANCER', message: 'ACTION TRIGGERED: Moving 5% TVL to Aave (Yield Spread > 0.5%).', highlight: true },
    { id: '4', timestamp: '15:00:15', type: 'TX', message: 'Confirmed. Cost: $0.05.', hash: '0x7f...a23' },
];

const HuntersLog: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const [isHovered, setIsHovered] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && !isHovered) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isHovered]);

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            if (isHovered) return;

            const newLog: LogEntry = {
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                type: Math.random() > 0.7 ? 'SCANNER' : 'ORACLE',
                message: Math.random() > 0.5 ? 'Heartbeat check complete. No anomalies.' : 'Price feed synced. Deviation < 0.1%.',
            };

            setLogs(prev => [...prev.slice(-20), newLog]); // Keep last 20 logs
        }, 3000);

        return () => clearInterval(interval);
    }, [isHovered]);

    const getTypeColor = (type: LogType) => {
        switch (type) {
            case 'SCANNER': return 'text-blue-400';
            case 'ORACLE': return 'text-gray-400';
            case 'REBALANCER': return 'text-purple-400';
            case 'TX': return 'text-green-400';
            default: return 'text-gray-500';
        }
    };

    return (
        <div
            className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden flex flex-col h-96 relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Live Transaction Feed</span>
                <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/20" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                    <div className="w-2 h-2 rounded-full bg-green-500/20" />
                </div>
            </div>

            {/* Log Feed */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-start space-x-2 p-1 rounded hover:bg-white/5 transition-colors cursor-default ${log.highlight ? 'bg-blue-900/10' : ''}`}
                        >
                            <span className="text-gray-600">[{log.timestamp}]</span>
                            <span className={`font-bold w-24 ${getTypeColor(log.type)}`}>[{log.type}]</span>
                            <span className="text-gray-300 flex-1">{log.message}</span>
                            {log.hash && (
                                <a
                                    href={`https://basescan.org/tx/${log.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 hover:underline"
                                >
                                    <span>{log.hash}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Glitch Border Effect */}
            <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:border-blue-500/20 transition-colors rounded-lg" />
        </div>
    );
};

export default HuntersLog;
