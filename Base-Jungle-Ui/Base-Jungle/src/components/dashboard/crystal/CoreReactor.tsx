import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import GlassCard from './GlassCard';

interface CoreReactorProps {
    netWorth: number;
    tvl: number;
}

const CoreReactor: React.FC<CoreReactorProps> = ({ netWorth, tvl }) => {
    const fluidRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (fluidRef.current) {
            // Pulse animation
            const time = state.clock.getElapsedTime();
            fluidRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
            fluidRef.current.rotation.y = Math.cos(time * 0.3) * 0.2;
        }
    });

    return (
        <GlassCard position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]} title="Core Reactor">
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Ferrofluid Core */}
                <mesh ref={fluidRef} position={[0, 0, 0]}>
                    <sphereGeometry args={[0.8, 64, 64]} />
                    <MeshDistortMaterial
                        color="#0052FF"
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0}
                        metalness={0.5}
                        distort={0.4}
                        speed={2}
                    />
                </mesh>

                {/* Data Overlay */}
                <group position={[0, 0, 1]}>
                    <Text
                        position={[0, 0.2, 0]}
                        fontSize={0.3}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                    >
                        ${netWorth.toLocaleString()}
                    </Text>
                    <Text
                        position={[0, -0.2, 0]}
                        fontSize={0.1}
                        color="#88ccff"
                        anchorX="center"
                        anchorY="middle"
                    >
                        TVL: ${tvl.toLocaleString()}
                    </Text>
                </group>
            </Float>
        </GlassCard>
    );
};

export default CoreReactor;
