import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AntigravityScene: React.FC = () => {
    const ref = useRef<THREE.Points>(null);

    // Generate random particles
    const positions = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // z
        }
        return positions;
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            // Gentle rotation
            ref.current.rotation.x -= delta / 20;
            ref.current.rotation.y -= delta / 30;

            // Mouse interaction (Magnetic Repulsor)
            // Note: For a full physics simulation we'd use shaders, but this is a lightweight approximation
            const time = state.clock.getElapsedTime();
            ref.current.position.y = Math.sin(time / 4) * 0.2; // Float effect
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#0052FF"
                    size={0.02}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.6}
                />
            </Points>
        </group>
    );
};

export default AntigravityScene;
