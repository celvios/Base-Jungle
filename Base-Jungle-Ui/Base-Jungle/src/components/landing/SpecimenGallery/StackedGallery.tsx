import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { NoviceAsset, ScoutAsset, CaptainAsset, WhaleAsset } from './GalleryAssets';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, ChevronDown } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

const StackedGallery: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { isConnected } = useAccount();
    const { open } = useAppKit();

    const tiers = [
        { id: 1, name: 'Novice', price: '$100+', multiplier: '1.0x', leverage: '1.5x', Asset: NoviceAsset, color: 'text-blue-400' },
        { id: 2, name: 'Scout', price: '$500+', multiplier: '1.1x', leverage: '2.0x', Asset: ScoutAsset, color: 'text-cyan-400' },
        { id: 3, name: 'Captain', price: '$2,000+', multiplier: '1.25x', leverage: '3.0x', Asset: CaptainAsset, color: 'text-indigo-400' },
        { id: 4, name: 'Whale', price: '$10,000+', multiplier: '1.5x', leverage: '5.0x', Asset: WhaleAsset, color: 'text-purple-400' },
    ];

    const handleTarget = (tier: any) => {
        if (!isConnected) {
            open();
        } else {
            alert(`Ready to deposit ${tier.price} for ${tier.name} tier!`);
        }
    };

    return (
        <section className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-20 overflow-hidden">

            {/* Header */}
            <motion.div
                layout
                className="text-center mb-12 z-20"
            >
                <h2 className="text-4xl font-bold font-mono text-white mb-2">SPECIMEN ARCHIVE</h2>
                <p className="text-gray-500 font-mono text-sm">
                    {isExpanded ? "Holographic Array Deployed" : "Classified Tier Data // Access Required"}
                </p>
            </motion.div>

            {/* The Gallery Container */}
            <div className={`relative w-full max-w-6xl px-4 transition-all duration-700 ${isExpanded ? 'h-auto' : 'h-[600px] flex items-center justify-center'}`}>

                {/* 
                    LAYOUT LOGIC:
                    - Expanded: CSS Grid (2x2)
                    - Stacked: Absolute positioning center
                */}
                <motion.div
                    layout
                    className={`w-full ${isExpanded ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'relative w-[350px] h-[500px]'}`}
                >
                    {tiers.map((tier, index) => {
                        // Stacked Offsets
                        const stackOffset = index * 20; // Vertical offset
                        const scale = 1 - (index * 0.05); // Slight scale down for depth
                        const zIndex = tiers.length - index;

                        return (
                            <motion.div
                                key={tier.id}
                                layout
                                initial={false}
                                animate={isExpanded ? {
                                    top: 0,
                                    left: 0,
                                    scale: 1,
                                    y: 0,
                                    opacity: 1,
                                    zIndex: 1
                                } : {
                                    top: stackOffset,
                                    left: index * 10, // Slight horizontal fan
                                    scale: scale,
                                    y: 0,
                                    opacity: 1,
                                    zIndex: zIndex
                                }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className={`
                                    relative bg-blue-900/10 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden
                                    ${isExpanded ? 'h-[500px] w-full' : 'absolute w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.5)]'}
                                `}
                            >
                                {/* 3D Asset Background */}
                                <div className="absolute inset-0 z-0 opacity-50">
                                    <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                                        <ambientLight intensity={0.5} />
                                        <pointLight position={[10, 10, 10]} intensity={1} />
                                        <group rotation={[0.2, 0, 0]}>
                                            <tier.Asset />
                                        </group>
                                        <Environment preset="city" />
                                    </Canvas>
                                </div>

                                {/* Card Content */}
                                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                                    {/* Top Label */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Specimen 0{tier.id}</div>
                                            <h3 className={`text-3xl font-bold ${tier.color}`}>{tier.name}</h3>
                                        </div>
                                        {/* "Whisper" Effect: Only show full details if expanded or top card */}
                                        {(!isExpanded && index !== 0) && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        )}
                                    </div>

                                    {/* Details (Visible on Top Card or Expanded) */}
                                    <motion.div
                                        animate={{ opacity: (isExpanded || index === 0) ? 1 : 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3 border-t border-white/10 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-mono uppercase">Entry</span>
                                                <span className="text-lg font-bold text-white">{tier.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-mono uppercase">Multiplier</span>
                                                <span className="text-lg font-bold text-blue-300">{tier.multiplier}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-mono uppercase">Leverage</span>
                                                <span className="text-lg font-bold text-purple-300">{tier.leverage}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {isExpanded ? (
                                            <Button
                                                onClick={() => handleTarget(tier)}
                                                className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500/50 text-white font-mono uppercase tracking-widest transition-all"
                                            >
                                                Target Status <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        ) : (
                                            index === 0 && (
                                                <Button
                                                    onClick={() => setIsExpanded(true)}
                                                    className="w-full bg-white text-black hover:bg-gray-200 font-mono uppercase tracking-widest font-bold"
                                                >
                                                    View All Specs <ChevronDown className="ml-2 w-4 h-4" />
                                                </Button>
                                            )
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Collapse Button (Only when expanded) */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-12"
                >
                    <Button
                        variant="ghost"
                        onClick={() => setIsExpanded(false)}
                        className="text-gray-500 hover:text-white font-mono uppercase tracking-widest text-xs"
                    >
                        Close Archive
                    </Button>
                </motion.div>
            )}

        </section>
    );
};

export default StackedGallery;
