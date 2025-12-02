import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Tetrahedron, Dodecahedron, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. Sprout (Novice) - Glowing Blue Sphere
export const SproutAsset = () => {
    return (
        <Sphere args={[0.8, 32, 32]}>
            <MeshDistortMaterial
                color="#4ade80" // Greenish for Sprout
                emissive="#22c55e"
                emissiveIntensity={0.5}
                distort={0.4}
                speed={2}
                roughness={0.2}
            />
        </Sphere>
    );
};

// 2. Shard (Scout) - Sharp Crystal Tetrahedron
export const ShardAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.01;
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
        }
    });
    return (
        <Tetrahedron ref={ref} args={[1, 0]}>
            <meshPhysicalMaterial
                color="#06b6d4" // Cyan
                transmission={0.6}
                thickness={1}
                roughness={0}
                ior={1.5}
                clearcoat={1}
            />
        </Tetrahedron>
    );
};

// 3. Core (Captain) - Complex Geometric Core
export const CoreAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ref.current && ringRef.current) {
            ref.current.rotation.y -= 0.02;
            ref.current.rotation.z += 0.01;
            ringRef.current.rotation.x += 0.03;
        }
    });

    return (
        <group>
            <Dodecahedron ref={ref} args={[0.7, 0]}>
                <meshStandardMaterial
                    color="#3b82f6" // Blue
                    emissive="#1d4ed8"
                    emissiveIntensity={0.8}
                    wireframe
                />
            </Dodecahedron>
            <torusGeometry args={[1.2, 0.05, 16, 100]} />
            <mesh ref={ringRef}>
                <torusGeometry args={[1.1, 0.02, 16, 100]} />
                <meshBasicMaterial color="#60a5fa" />
            </mesh>
        </group>
    );
};

// 4. Whale (Whale) - Massive Wireframe Construct
export const WhaleAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            // Slow, heavy rotation
            ref.current.rotation.y += 0.005;
        }
    });

    return (
        <Icosahedron ref={ref} args={[1.2, 1]}>
            <meshStandardMaterial
                color="#8b5cf6" // Purple
                wireframe
                emissive="#7c3aed"
                emissiveIntensity={0.5}
            />
        </Icosahedron>
    );
};
