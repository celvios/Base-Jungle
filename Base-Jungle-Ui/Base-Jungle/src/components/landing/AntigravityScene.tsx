import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AntigravityScene: React.FC = () => {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 2000;

    // Generate initial random positions
    const { initialPositions, currentPositions } = useMemo(() => {
        const initial = new Float32Array(count * 3);
        const current = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 15;
            const y = (Math.random() - 0.5) * 15;
            const z = (Math.random() - 0.5) * 15;

            initial[i * 3] = x;
            initial[i * 3 + 1] = y;
            initial[i * 3 + 2] = z;

            current[i * 3] = x;
            current[i * 3 + 1] = y;
            current[i * 3 + 2] = z;
        }
        return { initialPositions: initial, currentPositions: current };
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const time = state.clock.getElapsedTime();
        const mouse = state.pointer; // Normalized mouse coordinates (-1 to +1)

        // Convert mouse to world space (approximate at z=0 plane for simplicity)
        // For a more accurate raycast, we'd use a Raycaster, but this is faster for particles
        const mouseVector = new THREE.Vector3(mouse.x * 8, mouse.y * 5, 0);

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Get current home position (with some floating animation)
            const homeX = initialPositions[i3];
            const homeY = initialPositions[i3 + 1] + Math.sin(time * 0.5 + initialPositions[i3]) * 0.2;
            const homeZ = initialPositions[i3 + 2];

            // Calculate distance to mouse
            const dx = positions[i3] - mouseVector.x;
            const dy = positions[i3 + 1] - mouseVector.y;
            // We ignore Z distance for the "force field" cylinder effect, or include it for a sphere effect
            // Let's use a 2D cylinder effect for better feel on screen
            const distSq = dx * dx + dy * dy;
            const repulsionRadiusSq = 4; // Radius of 2 units

            if (distSq < repulsionRadiusSq) {
                const dist = Math.sqrt(distSq);
                const force = (2 - dist) * 0.1; // Repulsion strength

                const angle = Math.atan2(dy, dx);

                // Push away
                positions[i3] += Math.cos(angle) * force;
                positions[i3 + 1] += Math.sin(angle) * force;
            } else {
                // Return to home
                positions[i3] += (homeX - positions[i3]) * 0.05;
                positions[i3 + 1] += (homeY - positions[i3 + 1]) * 0.05;
                positions[i3 + 2] += (homeZ - positions[i3 + 2]) * 0.05;
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Gentle global rotation
        pointsRef.current.rotation.y = time * 0.05;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={currentPositions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                transparent
                color="#0052FF"
                size={0.03}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default AntigravityScene;
