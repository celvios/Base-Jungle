import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import GlassMonolith from './GlassMonolith';
import { NoviceAsset, ScoutAsset, CaptainAsset, WhaleAsset } from './GalleryAssets';
import SelectionOverlay from './SelectionOverlay';

const ParallaxScroll: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
    });

    const [activeTier, setActiveTier] = useState<any>(null);

    // Parallax Transforms
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
    const assetX = useTransform(scrollYProgress, [0, 1], [0, -15]); // 3D units

    const tiers = [
        { id: 1, name: 'Novice', price: '$100+', multiplier: '1.0x', leverage: 'None', Asset: NoviceAsset },
        { id: 2, name: 'Scout', price: '$500+', multiplier: '1.1x', leverage: '2.0x', Asset: ScoutAsset },
        { id: 3, name: 'Captain', price: '$2,000+', multiplier: '1.25x', leverage: '3.0x', Asset: CaptainAsset },
        { id: 4, name: 'Whale', price: '$10,000+', multiplier: '1.5x', leverage: '5.0x', Asset: WhaleAsset },
    ];

    // Determine active card based on scroll position
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        const unsubscribe = scrollYProgress.onChange(v => {
            const index = Math.round(v * (tiers.length - 1));
            setActiveIndex(index);
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-[#050505]">
            <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">

                {/* 3D Scene Layer (Background/Midground) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />

                        {/* Floating Assets Container */}
                        <group position={[0, 1.5, 0]}> {/* Lifted up to float above cards */}
                            {tiers.map((tier, i) => {
                                // Calculate position based on index and scroll
                                // We manually animate the group position in 3D space to match scroll
                                // Note: For true sync we'd pass the motion value to a component inside Canvas
                                const xPos = (i * 5) - (activeIndex * 5); // Simplified logic for demo
                                const isActive = i === activeIndex;

                                return (
                                    <group key={tier.id} position={[xPos, 0, 0]} scale={isActive ? 1.2 : 0.8}>
                                        <tier.Asset />
                                    </group>
                                );
                            })}
                        </group>

                        <Environment preset="city" />
                    </Canvas>
                </div>

                {/* UI Layer (Foreground Cards) */}
                <div className="relative z-10 px-24 w-full">
                    <motion.div style={{ x }} className="flex gap-32 items-center">
                        {tiers.map((tier, i) => (
                            <div key={tier.id} className="flex-shrink-0">
                                <GlassMonolith
                                    tier={tier}
                                    isActive={i === activeIndex}
                                    onClick={() => setActiveTier(tier)}
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Header */}
                <div className="absolute top-12 left-12 z-20">
                    <h2 className="text-4xl font-bold font-mono text-white">SPECIMEN GALLERY</h2>
                    <p className="text-gray-500 font-mono text-sm mt-2">Cryo-Stasis Lab // Scroll to Inspect</p>
                </div>
            </div>

            {/* Selection Overlay (Deposit Interface) */}
            <SelectionOverlay
                activeTier={activeTier}
                onClose={() => setActiveTier(null)}
            />
        </section>
    );
};

export default ParallaxScroll;
