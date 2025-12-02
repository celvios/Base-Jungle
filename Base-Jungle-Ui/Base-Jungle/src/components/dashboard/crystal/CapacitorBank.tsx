import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';
import GlassCard from './GlassCard';

interface CapacitorBankProps {
    points: number;
    dailyRate: number;
}

const CapacitorBank: React.FC<CapacitorBankProps> = ({ points, dailyRate }) => {
    const fillRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (fillRef.current) {
            const time = state.clock.getElapsedTime();
            // Pulse animation based on daily rate
            const pulseSpeed = Math.min(dailyRate / 100, 5);
            fillRef.current.children.forEach((child: any, i) => {
                child.material.emissiveIntensity = 0.5 + Math.sin(time * pulseSpeed + i) * 0.5;
            });
        }
    });

    return (
        <GlassCard position={[-3, 2, 0]} scale={[1, 1, 1]} title="Points">
            <group position={[-0.5, -0.5, 0]}>
                {/* Fuel Rods */}
                <group ref={fillRef}>
                    {[...Array(3)].map((_, i) => (
                        <mesh key={i} position={[i * 0.5, 0, 0]}>
                            <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
                            <meshStandardMaterial
                                color="#0052FF"
                                emissive="#0052FF"
                                emissiveIntensity={0.5}
                                transparent
                                opacity={0.8}
                            />
                        </mesh>
                    ))}
                </group>

                {/* Glass Casings */}
                {[...Array(3)].map((_, i) => (
                    <mesh key={`case-${i}`} position={[i * 0.5, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 1.6, 16]} />
                        <meshPhysicalMaterial
                            transmission={0.9}
                            roughness={0}
                            thickness={0.1}
                            color="white"
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                ))}
            </group>

            <group position={[0, -1.2, 0]}>
                <Text
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="top"
                >
                    {points.toLocaleString()}
                </Text>
                <Text
                    position={[0, -0.25, 0]}
                    fontSize={0.08}
                    color="#888"
                    anchorX="center"
                    anchorY="top"
                >
                    PTS
                </Text>
            </group>
        </GlassCard>
    );
};

export default CapacitorBank;
