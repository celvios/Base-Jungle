import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const GenesisSeed: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.25;

            // Pulse effect scale
            const time = state.clock.getElapsedTime();
            const scale = 1 + Math.sin(time * 2) * 0.02; // 60 BPM pulse approx
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => setActive(!active)}
                scale={active ? 1.2 : 1}
            >
                <icosahedronGeometry args={[1.5, 0]} />
                <MeshTransmissionMaterial
                    backside
                    backsideThickness={5} // Thickness of the backside
                    thickness={2} // Thickness of the glass
                    roughness={0.2} // Frosted edges
                    transmission={0.9} // High clarity
                    ior={1.5} // Index of refraction
                    chromaticAberration={0.1} // Slight color splitting
                    anisotropy={0.5}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.1}
                    color="#0052FF" // Base Blue tint
                    background={new THREE.Color('#050505')}
                />

                {/* Internal Light Core */}
                <pointLight color="#0052FF" intensity={2} distance={5} decay={2} />
            </mesh>

            {/* Outer Glow */}
            <pointLight position={[0, 0, 0]} intensity={hovered ? 1 : 0.5} color="#0052FF" distance={3} />
        </Float>
    );
};

export default GenesisSeed;
