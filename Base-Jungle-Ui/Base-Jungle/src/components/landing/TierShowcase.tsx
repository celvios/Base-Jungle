import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Carousel from './SpecimenRing/Carousel';
import DepositInterface from './SpecimenRing/DepositInterface';

const TierShowcase: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const tiers = [
        { id: 1, name: 'Sprout', price: '$100', risk: 'Low', lock: '90 Days', color: 'from-green-400 to-green-600' },
        { id: 2, name: 'Sapling', price: '$400', risk: 'Low', lock: '180 Days', color: 'from-emerald-400 to-emerald-600' },
        { id: 3, name: 'Branch', price: '$1,200', risk: 'Moderate', lock: 'Balanced', color: 'from-teal-400 to-teal-600' },
        { id: 4, name: 'Tree', price: '$3,600', risk: 'Moderate', lock: '2x Leverage', color: 'from-cyan-400 to-cyan-600' },
        { id: 5, name: 'Grove', price: '$7,200', risk: 'Aggressive', lock: '3x Leverage', color: 'from-blue-400 to-blue-600' },
        { id: 6, name: 'Forest', price: '$14,400', risk: 'Aggressive', lock: '5x Leverage', color: 'from-indigo-400 to-indigo-600' },
    ];

    return (
        <section className="relative h-screen bg-[#050505] overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-12 left-8 z-10 pointer-events-none">
                <h2 className="text-4xl font-bold font-mono text-white">SPECIMEN RING</h2>
                <p className="text-gray-500 font-mono text-sm mt-2">Select your target containment unit</p>
            </div>

            {/* 3D Carousel Canvas */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <Carousel
                        tiers={tiers}
                        activeIndex={activeIndex}
                        onSelect={setActiveIndex}
                    />

                    <Environment preset="city" />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 3}
                    />
                </Canvas>
            </div>

            {/* Deposit Interface Overlay */}
            <DepositInterface activeTier={tiers[activeIndex]} />
        </section>
    );
};

export default TierShowcase;
