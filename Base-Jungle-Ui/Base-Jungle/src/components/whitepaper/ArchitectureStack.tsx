import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Box, Cpu, Globe, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface Layer {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    description: string;
    components: string[];
}

const layers: Layer[] = [
    {
        id: 'layer-1',
        title: 'Application Layer',
        icon: Globe,
        color: 'text-blue-400',
        description: 'The user-facing interface and external automation services that interact with the protocol.',
        components: ['Web Interface (React)', 'Keeper Network (Node.js)', 'Analytics Indexer']
    },
    {
        id: 'layer-2',
        title: 'Protocol Layer',
        icon: Cpu,
        color: 'text-purple-400',
        description: 'The core smart contracts governing strategy execution, risk management, and yield routing.',
        components: ['Strategy Controller', 'Harvest Manager', 'Rebalance Logic']
    },
    {
        id: 'layer-3',
        title: 'Vault Layer',
        icon: Box,
        color: 'text-green-400',
        description: 'Secure storage of user assets and issuance of receipt tokens (share classes).',
        components: ['Base Vault (ERC-4626)', 'Access Control ACL', 'Fee Collector']
    },
    {
        id: 'layer-4',
        title: 'Infrastructure Layer',
        icon: Layers,
        color: 'text-orange-400',
        description: 'Underlying blockchain primitives and external DeFi protocols utilized by the strategies.',
        components: ['Base Blockchain (L2)', 'Aerodrome (DEX)', 'Aave V3 (Lending)', 'Chainlink Oracles']
    }
];

const ArchitectureStack: React.FC = () => {
    const [expandedId, setExpandedId] = useState<string | null>('layer-2');

    return (
        <div className="w-full space-y-4">
            {layers.map((layer) => {
                const isExpanded = expandedId === layer.id;

                return (
                    <motion.div
                        key={layer.id}
                        initial={false}
                        animate={{
                            backgroundColor: isExpanded ? 'rgba(17, 24, 39, 0.6)' : 'rgba(17, 24, 39, 0.3)',
                            borderColor: isExpanded ? 'rgba(59, 130, 246, 0.3)' : 'rgba(31, 41, 55, 0.5)'
                        }}
                        className="border rounded-xl overflow-hidden backdrop-blur-sm transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : layer.id)}
                    >
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg bg-gray-900/50 ${layer.color}`}>
                                    <layer.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{layer.title}</h3>
                                    {!isExpanded && (
                                        <p className="text-xs text-gray-500 truncate max-w-[300px]">{layer.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-gray-500">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="h-px w-full bg-gray-800 mb-4" />
                                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                            {layer.description}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {layer.components.map((comp, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded text-xs text-gray-300 font-mono"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                    {comp}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ArchitectureStack;
