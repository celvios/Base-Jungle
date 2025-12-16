import { useState, useEffect } from 'react';

export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'INFO' | 'SCAN' | 'SUCCESS' | 'WARNING' | 'ERROR';
    message: string;
}

const LOG_TEMPLATES = [
    { level: 'SCAN', message: 'Scanning Aerodrome USDC/DAI pool liquidity...' },
    { level: 'INFO', message: 'Aerodrome Base APY: 12.5%' },
    { level: 'SCAN', message: 'Checking Aave V3 Supply Rates...' },
    { level: 'INFO', message: 'Aave USDC Supply Rate: 3.2%' },
    { level: 'SCAN', message: 'Analyzing Volatile LP (ETH/USDC) divergence...' },
    { level: 'INFO', message: 'Impermanent Loss risk: Low (<0.1%)' },
    { level: 'SCAN', message: 'Searching for arbitrage routes...' },
    { level: 'INFO', message: 'Route: Dodo -> Uniswap -> Curve (Net Profit: $0.00)' },
    { level: 'INFO', message: 'Route: Balancer -> Aerodrome (Slippage too high)' },
    { level: 'SUCCESS', message: 'Auto-compound cycle complete. Yield reinvested.' },
    { level: 'SCAN', message: 'Verifying collateralization ratio...' },
    { level: 'INFO', message: 'Health Factor: 2.15 (Safe)' },
    { level: 'SCAN', message: 'Checking Keeper bot gas balance...' },
    { level: 'INFO', message: 'Gas Price: 0.05 gwei (Optimal)' },
    { level: 'SCAN', message: 'Syncing with Oracle price feeds...' },
    { level: 'INFO', message: 'Oracle Update: ETH/USD $2254.30' },
];

export function useTradingLogs(maxLogs = 8) {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Initial logs
        setLogs([
            { id: 'init-1', timestamp: new Date(Date.now() - 5000), level: 'INFO', message: 'System initialized' },
            { id: 'init-2', timestamp: new Date(Date.now() - 4000), level: 'SUCCESS', message: 'Connected to Base Sepolia' },
            { id: 'init-3', timestamp: new Date(Date.now() - 2000), level: 'SCAN', message: 'Starting strategy engine...' },
        ]);

        const interval = setInterval(() => {
            const randomLog = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];

            setLogs(prev => {
                const newLog: LogEntry = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    level: randomLog.level as any,
                    message: randomLog.message
                };

                // Keep only last N logs
                const newLogs = [...prev, newLog];
                return newLogs.slice(-maxLogs);
            });

        }, 2500); // New log every 2.5s

        return () => clearInterval(interval);
    }, [maxLogs]);

    return logs;
}
