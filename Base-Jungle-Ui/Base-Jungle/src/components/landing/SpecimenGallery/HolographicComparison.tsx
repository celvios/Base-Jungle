import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { NoviceAsset, ScoutAsset, CaptainAsset, WhaleAsset } from './GalleryAssets';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

const HolographicComparison: React.FC = () => {
    const { isConnected } = useAccount();
    const { open } = useAppKit();

    const tiers = [
        {
            id: 1,
            name: 'NOVICE',
            Asset: NoviceAsset,
            color: 'text-blue-400',
            borderColor: 'border-blue-500',
            shadowColor: 'shadow-blue-500/20',
            benefits: [
                'Entry Deposit: $100 - $499',
                'Active Referrals: 0 - 4',
                'Point Multiplier: 1.0x',
                'Max Leverage: 1.5x',
                'Strategy Access: Conservative Only'
            ],
            price: '$100'
        },
        {
            id: 2,
            name: 'SCOUT',
            Asset: ScoutAsset,
            color: 'text-cyan-400',
            borderColor: 'border-cyan-500',
            shadowColor: 'shadow-cyan-500/20',
            benefits: [
                'Entry Deposit: $500 - $1,999',
                'Active Referrals: 5 - 19',
                'Point Multiplier: 1.1x',
                'Max Leverage: 2.0x',
                'Strategy Access: Balanced Strategies'
            ],
            price: '$500'
        },
        {
            id: 3,
            name: 'CAPTAIN',
            Asset: CaptainAsset,
            color: 'text-indigo-400',
            borderColor: 'border-indigo-500',
            shadowColor: 'shadow-indigo-500/20',
            benefits: [
                'Entry Deposit: $2,000 - $9,999',
                'Active Referrals: 20 - 49',
                'Point Multiplier: 1.25x',
                'Max Leverage: 3.0x',
                'Strategy Access: Leveraged LP Pools'
            ],
            price: '$2,000'
        },
        {
            id: 4,
            name: 'WHALE',
            Asset: WhaleAsset,
            color: 'text-purple-400',
            borderColor: 'border-purple-500',
            shadowColor: 'shadow-purple-500/20',
            benefits: [
                'Entry Deposit: $10,000+',
                'Active Referrals: 50+',
                'Point Multiplier: 1.5x',
                'Max Leverage: 5.0x',
                'Strategy Access: Delta-Neutral & Exclusive Vaults'
            ],
            price: '$10,000'
        },
    ];

    const handleTarget = (tier: any) => {
        if (!isConnected) {
            open();
        } else {
            alert(`Ready to deposit ${tier.price} for ${tier.name} tier!`);
        }
    };

    return (
        <section className="min-h-screen bg-[#050505] py-20 px-4 md:px-8 flex flex-col items-center justify-center">

            {/* Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold font-mono text-white mb-2">TIER ARRAY</h2>
                <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">Holographic Comparison View</p>
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
                {tiers.map((tier) => (
                    <motion.div
                        key={tier.id}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`
                            relative group flex flex-col bg-blue-900/5 backdrop-blur-xl 
                            border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300
                            hover:border-opacity-100 hover:${tier.borderColor} hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]
                            ${tier.shadowColor} hover:shadow-lg
                        `}
                    >
                        {/* Neon Outline Glow (Pseudo-element simulation via inset shadow or border) */}
                        <div className={`absolute inset-0 rounded-[2rem] border opacity-20 group-hover:opacity-100 transition-opacity duration-300 ${tier.borderColor}`} />

                        {/* Top: 3D Icon */}
                        <div className="h-32 w-full relative bg-gradient-to-b from-white/5 to-transparent">
                            <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} intensity={1} />
                                <group rotation={[0.2, 0, 0]}>
                                    <tier.Asset />
                                </group>
                                <Environment preset="city" />
                            </Canvas>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="mb-6">
                                <h3 className={`text-2xl font-bold font-mono ${tier.color} mb-1`}>{tier.name}</h3>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Status Level 0{tier.id}</div>
                            </div>

                            {/* Benefits List */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {tier.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                                        <span className="font-mono leading-tight">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Button
                                onClick={() => handleTarget(tier)}
                                className={`
                                    w-full font-mono uppercase tracking-widest text-xs h-12
                                    bg-transparent border border-white/10 hover:bg-white/5 
                                    group-hover:border-${tier.borderColor.split('-')[1]}-500/50
                                    transition-all duration-300 text-white
                                `}
                            >
                                Target Status
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default HolographicComparison;
