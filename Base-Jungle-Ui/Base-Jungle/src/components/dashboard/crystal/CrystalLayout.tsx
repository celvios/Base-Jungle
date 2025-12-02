import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import AntigravityScene from '@/components/landing/AntigravityScene';

interface CrystalLayoutProps {
    children: React.ReactNode;
}

const CrystalLayout: React.FC<CrystalLayoutProps> = ({ children }) => {
    return (
        <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
            {/* 3D Canvas Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 3}
                    />

                    <Suspense fallback={null}>
                        {/* Background Environment */}
                        <group scale={0.5} opacity={0.5}>
                            <AntigravityScene />
                        </group>

                        <Environment preset="city" />

                        {/* Grid Floor */}
                        <gridHelper
                            args={[50, 50, 0x0052FF, 0x111111]}
                            position={[0, -4, 0]}
                            rotation={[0, 0, 0]}
                        />

                        {/* 3D Modules Container */}
                        <group position={[0, 0, 0]}>
                            {children}
                        </group>
                    </Suspense>
                </Canvas>
            </div>

            {/* Overlay UI (Non-3D elements if needed) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* System Status Light */}
                <div className="absolute top-6 right-6 flex items-center gap-2 pointer-events-auto">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-blue-500">SYSTEM ONLINE</span>
                </div>
            </div>
        </div>
    );
};

export default CrystalLayout;
