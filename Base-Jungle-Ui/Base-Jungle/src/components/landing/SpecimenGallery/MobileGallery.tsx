import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { NoviceAsset, ScoutAsset, CaptainAsset, WhaleAsset } from './GalleryAssets';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import * as THREE from 'three';

// Gyroscope-controlled Asset Wrapper
const GyroAsset = ({ Asset }: { Asset: React.FC }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Default gentle rotation
            groupRef.current.rotation.y += 0.005;

            // Gyroscope "Window" Effect (Parallax)
            // We use a simplified approach: map mouse/pointer for dev, and device orientation if available
            // Note: In a real mobile browser, we'd attach to 'deviceorientation' event
            // For this implementation, we'll simulate it with a subtle sway
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
            groupRef.current.rotation.z = Math.cos(time * 0.3) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <Asset />
        </group>
    );
};

const MobileGallery: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { isConnected } = useAccount();
    const { open } = useAppKit();

    const tiers = [
        { id: 1, name: 'Novice', price: '$100+', multiplier: '1.0x', leverage: 'None', Asset: NoviceAsset },
        { id: 2, name: 'Scout', price: '$500+', multiplier: '1.1x', leverage: '2.0x', Asset: ScoutAsset },
        { id: 3, name: 'Captain', price: '$2,000+', multiplier: '1.25x', leverage: '3.0x', Asset: CaptainAsset },
        { id: 4, name: 'Whale', price: '$10,000+', multiplier: '1.5x', leverage: '5.0x', Asset: WhaleAsset },
    ];

    // Scroll Snap Detection
    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    const activeTier = tiers[activeIndex];

    const handleTarget = () => {
        if (!isConnected) {
            open();
        } else {
            alert(`Ready to deposit ${activeTier.price} for ${activeTier.name} tier!`);
        }
    };

    return (
        <section className="relative h-[80vh] bg-[#050505] flex flex-col justify-between py-8 overflow-hidden">

            {/* Background 3D Scene (The "Window") */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    {/* Render only the active asset */}
                    <GyroAsset Asset={activeTier.Asset} />

                    <Environment preset="city" />
                </Canvas>
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 pt-4">
                <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">Specimen 0{activeTier.id}</div>
                <h2 className="text-5xl font-bold text-white tracking-tight">{activeTier.name}</h2>
            </div>

            {/* Horizontal Scroll Snap Carousel */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="relative z-10 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-[40vh] items-center"
                style={{ scrollBehavior: 'smooth' }}
            >
                {tiers.map((tier, i) => (
                    <div key={tier.id} className="w-full flex-shrink-0 snap-center flex justify-center px-8">
                        {/* Transparent Card Frame */}
                        <div className="w-full h-full border border-white/10 rounded-3xl bg-blue-900/10 backdrop-blur-sm flex flex-col justify-end p-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                    <span className="text-gray-400 font-mono text-xs uppercase">Leverage</span>
                                    <span className="text-2xl font-bold text-purple-400">{tier.leverage}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-gray-500 font-mono text-[10px] uppercase">Multiplier</span>
                                    <span className="text-sm font-bold text-blue-300">{tier.multiplier}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-mono text-[10px] uppercase">Min Deposit</span>
                                    <span className="text-sm font-bold text-white">{tier.price}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Target Action Button */}
            <div className="relative z-10 px-6 pb-4">
                <Button
                    onClick={handleTarget}
                    className={`w-full h-14 font-mono uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,82,255,0.4)] ${isConnected
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-transparent border border-blue-500 text-blue-400'
                        }`}
                >
                    {isConnected ? (
                        <>Target {activeTier.name} Status <ArrowRight className="ml-2 w-4 h-4" /></>
                    ) : (
                        <>Connect Wallet <Wallet className="ml-2 w-4 h-4" /></>
                    )}
                </Button>
            </div>
        </section>
    );
};

export default MobileGallery;
