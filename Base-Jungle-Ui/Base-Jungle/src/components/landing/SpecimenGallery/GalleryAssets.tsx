import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Tetrahedron, Dodecahedron, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. Novice (The Seed) - Blue Cube
export const NoviceAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            // Lazy rotation
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
            ref.current.rotation.y += 0.005;
        }
    });

    return (
        <Box ref={ref} args={[1.2, 1.2, 1.2]}>
            <meshPhysicalMaterial
                color="#3b82f6" // Blue
                transmission={0.6}
                thickness={1}
                roughness={0.1}
                ior={1.5}
                clearcoat={1}
                emissive="#1d4ed8"
                emissiveIntensity={0.2}
            />
        </Box>
    );
};

// 2. Scout (The Structure) - Sharp Tetrahedron
export const ScoutAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            // Faster spin
            ref.current.rotation.y += 0.02;
            ref.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });
    return (
        <Tetrahedron ref={ref} args={[1.4, 0]}>
            <meshPhysicalMaterial
                color="#06b6d4" // Cyan
                transmission={0.7}
                thickness={0.8}
                roughness={0}
                ior={1.6}
                clearcoat={1}
                emissive="#0891b2"
                emissiveIntensity={0.3}
            />
        </Tetrahedron>
    );
};

// 3. Captain (The Core) - Dodecahedron with Rings
export const CaptainAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ref.current && ring1Ref.current && ring2Ref.current) {
            ref.current.rotation.y -= 0.01;
            ref.current.rotation.x += 0.005;

            // Gyroscopic rings
            ring1Ref.current.rotation.x += 0.02;
            ring1Ref.current.rotation.y += 0.01;

            ring2Ref.current.rotation.x -= 0.01;
            ring2Ref.current.rotation.z += 0.02;
        }
    });

    return (
        <group>
            <Dodecahedron ref={ref} args={[1, 0]}>
                <meshStandardMaterial
                    color="#2563eb" // Royal Blue
                    emissive="#1e40af"
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Dodecahedron>

            <mesh ref={ring1Ref}>
                <torusGeometry args={[1.6, 0.03, 16, 100]} />
                <meshBasicMaterial color="#60a5fa" />
            </mesh>

            <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.4, 0.03, 16, 100]} />
                <meshBasicMaterial color="#93c5fd" />
            </mesh>
        </group>
    );
};

// 4. Whale (The Network) - Fractal Geometric Web
export const WhaleAsset = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            // Breathing animation
            const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
            ref.current.scale.set(scale, scale, scale);

            // Tracking mouse (simplified here, full tracking in parent)
            ref.current.rotation.y += 0.002;
        }
    });

    return (
        <group ref={ref}>
            <Icosahedron args={[1.5, 1]}>
                <meshStandardMaterial
                    color="#7c3aed" // Violet
                    wireframe
                    emissive="#6d28d9"
                    emissiveIntensity={0.8}
                />
            </Icosahedron>

            {/* Inner Core */}
            <Icosahedron args={[0.8, 0]}>
                <MeshDistortMaterial
                    color="#4c1d95"
                    emissive="#5b21b6"
                    emissiveIntensity={1}
                    distort={0.4}
                    speed={2}
                />
            </Icosahedron>
        </group>
    );
};
