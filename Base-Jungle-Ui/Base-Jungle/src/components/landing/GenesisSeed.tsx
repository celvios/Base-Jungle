import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const GenesisSeed: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const shockwaveRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();

        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.25;

            // Pulse effect scale (Heartbeat)
            // Sharp attack, slow decay
            const pulse = Math.sin(time * 3);
            const scale = 1 + (pulse > 0.8 ? (pulse - 0.8) * 0.5 : 0);
            meshRef.current.scale.set(scale, scale, scale);
        }

        // Shockwave Animation
        if (shockwaveRef.current) {
            // Reset shockwave periodically
            const loopTime = 2; // seconds
            const progress = (time % loopTime) / loopTime;

            const scale = 1.5 + progress * 5; // Expand from 1.5 to 6.5
            const opacity = 1 - progress; // Fade out

            shockwaveRef.current.scale.set(scale, scale, scale);

            const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
            if (material) {
                material.opacity = opacity * 0.5;
            }
        }
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                {/* The Core */}
                <mesh
                    ref={meshRef}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={() => setActive(!active)}
                >
                    <icosahedronGeometry args={[1.5, 0]} />
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={5}
                        thickness={2}
                        roughness={0.2}
                        transmission={0.9}
                        ior={1.5}
                        chromaticAberration={0.1}
                        anisotropy={0.5}
                        distortion={0.5}
                        distortionScale={0.5}
                        temporalDistortion={0.1}
                        color="#0052FF"
                        background={new THREE.Color('#050505')}
                    />
                    <pointLight color="#0052FF" intensity={2} distance={5} decay={2} />
                </mesh>
            </Float>

            {/* The Shockwave Ring */}
            <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.02, 16, 100]} />
                <meshBasicMaterial color="#40a9ff" transparent opacity={0.5} />
            </mesh>

            {/* Outer Glow */}
            <pointLight position={[0, 0, 0]} intensity={hovered ? 1 : 0.5} color="#0052FF" distance={10} />
        </group>
    );
};

export default GenesisSeed;
