import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';

interface GlassCardProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    children?: React.ReactNode;
    title?: string;
    onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ position, rotation = [0, 0, 0], scale = [1, 1, 1], children, title, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Magnetic Cursor Repulsion
    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();

            // Subtle floating movement
            const baseY = position[1] + Math.sin(time * 0.5 + position[0]) * 0.05;

            // Mouse position in normalized device coordinates (-1 to +1)
            const mouse = state.pointer;

            // Convert mouse to world space (approximate)
            const mouseWorldX = mouse.x * 8;
            const mouseWorldY = mouse.y * 5;

            // Calculate distance from mouse to this card
            const dx = position[0] - mouseWorldX;
            const dy = position[1] - mouseWorldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Repulsion force (200px radius = ~2 units in 3D space)
            const repulsionRadius = 2;
            if (distance < repulsionRadius) {
                const force = (1 - distance / repulsionRadius) * 0.3;
                const angle = Math.atan2(dy, dx);

                // Apply repulsion
                meshRef.current.position.x = position[0] + Math.cos(angle) * force;
                meshRef.current.position.y = baseY + Math.sin(angle) * force;
            } else {
                // Smoothly return to original position
                meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, position[0], 0.1);
                meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, baseY, 0.1);
            }

            // Tilt towards mouse when hovered
            if (hovered) {
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation[0] + mouse.y * 0.1, 0.1);
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation[1] + mouse.x * 0.1, 0.1);
            } else {
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation[0], 0.1);
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation[1], 0.1);
            }
        }
    });

    return (
        <group position={position} rotation={rotation as any} scale={scale}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={onClick}
            >
                <boxGeometry args={[3, 2, 0.1]} />
                <MeshTransmissionMaterial
                    backside
                    backsideThickness={1}
                    thickness={0.5}
                    roughness={0.1}
                    transmission={0.95}
                    ior={1.5}
                    chromaticAberration={0.06}
                    anisotropy={0.1}
                    distortion={0.2}
                    distortionScale={0.3}
                    temporalDistortion={0.1}
                    color="#0052FF"
                    background={new THREE.Color('#050505')}
                />

                {/* Border Glow */}
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(3, 2, 0.1)]} />
                    <lineBasicMaterial color="#0052FF" transparent opacity={0.3} />
                </lineSegments>
            </mesh>

            {/* Content Container */}
            <group position={[0, 0, 0.1]}>
                {title && (
                    <Text
                        position={[-1.3, 0.8, 0]}
                        fontSize={0.1}
                        color="white"
                        anchorX="left"
                        anchorY="top"
                    >
                        {title.toUpperCase()}
                    </Text>
                )}
                {children}
            </group>

            {/* Ambient Glow Behind */}
            <pointLight position={[0, 0, -1]} intensity={hovered ? 2 : 1} color="#0052FF" distance={5} decay={2} />
        </group>
    );
};

export default GlassCard;
