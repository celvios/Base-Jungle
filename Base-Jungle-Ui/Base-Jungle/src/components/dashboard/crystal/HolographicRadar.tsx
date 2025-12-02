import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import GlassCard from './GlassCard';

interface HolographicRadarProps {
    logs: string[];
}

const HolographicRadar: React.FC<HolographicRadarProps> = ({ logs }) => {
    const scanRef = useRef<THREE.Mesh>(null);
    const [activeLog, setActiveLog] = useState(logs[0] || "Scanning...");

    useFrame((state) => {
        if (scanRef.current) {
            const time = state.clock.getElapsedTime();
            // Scan line movement
            scanRef.current.position.y = Math.sin(time * 2) * 0.8;
            scanRef.current.scale.x = 1 + Math.sin(time * 10) * 0.05; // Glitch effect
        }
    });

    // Cycle logs
    useEffect(() => {
        if (logs.length === 0) return;
        const interval = setInterval(() => {
            setActiveLog(logs[Math.floor(Math.random() * logs.length)]);
        }, 3000);
        return () => clearInterval(interval);
    }, [logs]);

    return (
        <GlassCard position={[3, 2, 0]} scale={[1, 1, 1]} title="Radar">
            {/* Holographic Sphere */}
            <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]}>
                <meshBasicMaterial color="#0052FF" wireframe transparent opacity={0.1} />
            </Sphere>

            {/* Scan Plane */}
            <mesh ref={scanRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.7, 0.8, 32]} />
                <meshBasicMaterial color="#00FFFF" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* Blips */}
            <mesh position={[0.3, 0.2, 0.2]}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshBasicMaterial color="white" />
            </mesh>

            {/* Projected Text Feed */}
            <group position={[0, -1.2, 0]}>
                <Text
                    fontSize={0.08}
                    color="#00FFFF"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={2}
                >
                    {`> ${activeLog}`}
                </Text>
            </group>
        </GlassCard>
    );
};

export default HolographicRadar;
