import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Wallet, Split, Server } from 'lucide-react';

interface LogicBlockDiagramProps {
    selectedTier: string;
}

const LogicBlockDiagram: React.FC<LogicBlockDiagramProps> = ({ selectedTier }) => {
    const [isHoveringOptimizer, setIsHoveringOptimizer] = useState(false);

    const getSplitLogic = () => {
        switch (selectedTier) {
            case 'sprout': return 'Split(60% Aave, 30% LP, 10% Stake)';
            case 'tree': return 'Split(40% Aave, 40% LP, 20% Lev)';
            case 'forest': return 'Split(20% Farm, 50% Lev, 30% D-N)';
            default: return 'Split Logic';
        }
    };

    return (
        <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

            <div className="flex items-center gap-2 mb-8 relative z-10">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-mono text-cyan-500 tracking-widest uppercase">Logic Block // Execution Flow</h3>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                {/* Node 1: Input */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-16 bg-blue-900/20 border border-blue-500/50 rounded flex items-center justify-center relative group">
                        <Wallet className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-xs font-mono text-blue-300">USER DEPOSIT</span>
                        <div className="absolute -bottom-6 text-[10px] text-gray-500 font-mono">USDC / ETH</div>
                    </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="text-gray-600 w-6 h-6 rotate-90 md:rotate-0" />

                {/* Node 2: Splitter */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-24 bg-purple-900/20 border border-purple-500/50 rounded flex flex-col items-center justify-center p-2 text-center relative">
                        <Split className="w-5 h-5 text-purple-400 mb-1" />
                        <span className="text-xs font-mono text-purple-300 font-bold">LOGIC GATE A</span>
                        <span className="text-[10px] font-mono text-gray-400 mt-1">{getSplitLogic()}</span>
                    </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="text-gray-600 w-6 h-6 rotate-90 md:rotate-0" />

                {/* Node 3: Optimizer (Interactive) */}
                <div className="relative">
                    <motion.div
                        className="w-40 h-24 bg-cyan-900/20 border border-cyan-500/50 rounded flex flex-col items-center justify-center p-2 text-center cursor-help hover:bg-cyan-900/30 transition-colors"
                        onMouseEnter={() => setIsHoveringOptimizer(true)}
                        onMouseLeave={() => setIsHoveringOptimizer(false)}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Cpu className="w-5 h-5 text-cyan-400 mb-1" />
                        <span className="text-xs font-mono text-cyan-300 font-bold">STRATEGY CONTROLLER</span>
                        <span className="text-[10px] font-mono text-gray-400 mt-1">Scan(Sources) -{">"} Max(APY)</span>

                        {/* Pulsing Dot */}
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    </motion.div>

                    {/* Debug Window Popover */}
                    <AnimatePresence>
                        {isHoveringOptimizer && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-black border border-cyan-500/50 rounded shadow-2xl z-50 p-3"
                            >
                                <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                                    <span className="text-[10px] font-mono text-cyan-500">DEBUGGER :: OPTIMIZER.JS</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                    </div>
                                </div>
                                <pre className="text-[10px] font-mono text-gray-300 overflow-x-auto">
                                    <code>
                                        {`function rebalance() {
  // 1. Fetch Rates
  cur = Aave.getRate();
  new = Moonwell.getRate();
  
  // 2. Check Threshold
  if (new > cur + 0.5%) {
    return executeSwap();
  }
  return maintain();
}`}
                                    </code>
                                </pre>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Arrow */}
                <ArrowRight className="text-gray-600 w-6 h-6 rotate-90 md:rotate-0" />

                {/* Node 4: Protocols */}
                <div className="flex flex-col gap-2">
                    <div className="w-32 h-8 bg-gray-800 border border-gray-700 rounded flex items-center px-3 gap-2">
                        <Server className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-mono text-gray-300">Aave v3</span>
                    </div>
                    <div className="w-32 h-8 bg-gray-800 border border-gray-700 rounded flex items-center px-3 gap-2">
                        <Server className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-mono text-gray-300">Aerodrome</span>
                    </div>
                    <div className="w-32 h-8 bg-gray-800 border border-gray-700 rounded flex items-center px-3 gap-2">
                        <Server className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-mono text-gray-300">Moonwell</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LogicBlockDiagram;
