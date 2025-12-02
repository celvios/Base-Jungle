import React from 'react';
import { motion } from 'framer-motion';

interface LogicBlockDiagramProps {
    selectedTier: string;
}

const LogicBlockDiagram: React.FC<LogicBlockDiagramProps> = ({ selectedTier }) => {
    // Simplified logic data based on tier
    const getLogic = () => {
        switch (selectedTier) {
            case 'sprout':
                return [
                    { id: 1, label: 'User Deposit', type: 'input' },
                    { id: 2, label: 'Safety Check', type: 'process' },
                    { id: 3, label: 'Stablecoin LP', type: 'action' },
                    { id: 4, label: 'Yield Harvest', type: 'output' }
                ];
            case 'tree':
                return [
                    { id: 1, label: 'User Deposit', type: 'input' },
                    { id: 2, label: 'Leverage Check (2x)', type: 'process' },
                    { id: 3, label: 'AERO/USDC LP', type: 'action' },
                    { id: 4, label: 'Auto-Compound', type: 'loop' },
                    { id: 5, label: 'Yield Harvest', type: 'output' }
                ];
            default: // forest/jungle
                return [
                    { id: 1, label: 'User Deposit', type: 'input' },
                    { id: 2, label: 'Max Leverage (5x)', type: 'process' },
                    { id: 3, label: 'Delta Neutral Strat', type: 'action' },
                    { id: 4, label: 'Rebalance Bot', type: 'loop' },
                    { id: 5, label: 'Yield Harvest', type: 'output' }
                ];
        }
    };

    const steps = getLogic();

    return (
        <div className="bg-[#0a0a0a] border border-cyan-900/30 rounded-xl p-8 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0833441a_1px,transparent_1px),linear-gradient(to_bottom,#0833441a_1px,transparent_1px)] bg-[size:24px_24px]" />

            <h3 className="text-cyan-500 font-mono text-sm mb-8 relative z-10 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                LOGIC FLOW VISUALIZATION
            </h3>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className={`
                                relative p-4 rounded border font-mono text-xs text-center w-32
                                ${step.type === 'input' ? 'border-green-500/50 text-green-400 bg-green-900/10' :
                                    step.type === 'output' ? 'border-blue-500/50 text-blue-400 bg-blue-900/10' :
                                        step.type === 'loop' ? 'border-purple-500/50 text-purple-400 bg-purple-900/10' :
                                            'border-cyan-500/50 text-cyan-400 bg-cyan-900/10'}
                            `}
                        >
                            {step.label}
                            {/* Connector Dot */}
                            <div className="absolute -right-1 top-1/2 w-2 h-2 bg-black border border-current rounded-full translate-x-1/2 -translate-y-1/2 hidden md:block" />
                        </motion.div>

                        {index < steps.length - 1 && (
                            <div className="h-8 w-px md:w-8 md:h-px bg-gray-800 relative">
                                <motion.div
                                    className="absolute inset-0 bg-cyan-500"
                                    initial={{ scaleX: 0, originX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: index * 0.2 + 0.1, duration: 0.5 }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default LogicBlockDiagram;
