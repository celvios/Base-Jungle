import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AntigravityParticles: React.FC = () => {
    const { size, viewport, camera } = useThree();
    const pointsRef = useRef<THREE.Points>(null);
    const count = 7500; // Target 5000-10000 particles

    // Mouse tracking in 3D space
    const mousePosition = useRef(new THREE.Vector3(0, 0, 0));

    // Initialize particles
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const originalPositions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Random distribution: X(-800, 800), Y(-800, 800), Z(-500, 500)
            const x = (Math.random() - 0.5) * 1600;
            const y = (Math.random() - 0.5) * 1600;
            const z = (Math.random() - 0.5) * 1000;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;

            // Initialize velocities to 0
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;

            // Random phase for organic movement
            phases[i] = Math.random() * Math.PI * 2;
        }

        return { positions, originalPositions, velocities, phases };
    }, [count]);

    // Update mouse position
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            // Convert screen coordinates to normalized device coordinates (-1 to 1)
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Project to 3D world space at z=0 plane
            const vector = new THREE.Vector3(x, y, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            const pos = camera.position.clone().add(dir.multiplyScalar(distance));

            mousePosition.current.copy(pos);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [camera]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const time = state.clock.getElapsedTime();
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const { originalPositions, velocities, phases } = particles;

        const repulsionRadius = 250; // Adjustable: 150-300
        const repulsionStrength = 10; // Adjustable: 5-15
        const damping = 0.92; // Adjustable: 0.85-0.95
        const returnStrength = 0.02; // Strength of return to original position

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            // Current position
            let px = positions[idx];
            let py = positions[idx + 1];
            let pz = positions[idx + 2];

            // 1. Base Antigravity Float (Sine/Cosine oscillation)
            // Very slow organic movement
            const floatSpeed = 0.001;
            const floatAmp = 1.5;
            const phase = phases[i];

            const floatX = Math.sin(time * floatSpeed + phase) * floatAmp;
            const floatY = Math.cos(time * floatSpeed + phase * 0.5) * floatAmp;

            // 2. Calculate Distance to Mouse
            const dx = px - mousePosition.current.x;
            const dy = py - mousePosition.current.y;
            const dz = pz - mousePosition.current.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSq);

            // 3. Apply Repulsion Force
            if (dist < repulsionRadius) {
                const force = (repulsionRadius - dist) / repulsionRadius;
                const forceFactor = force * force * repulsionStrength; // Exponential falloff

                // Normalize direction and apply force
                velocities[idx] += (dx / dist) * forceFactor;
                velocities[idx + 1] += (dy / dist) * forceFactor;
                velocities[idx + 2] += (dz / dist) * forceFactor;
            }

            // 4. Apply Return Force (Spring back to original + float)
            const targetX = originalPositions[idx] + floatX;
            const targetY = originalPositions[idx + 1] + floatY;
            const targetZ = originalPositions[idx + 2];

            velocities[idx] += (targetX - px) * returnStrength;
            velocities[idx + 1] += (targetY - py) * returnStrength;
            velocities[idx + 2] += (targetZ - pz) * returnStrength;

            // 5. Apply Velocity & Damping
            velocities[idx] *= damping;
            velocities[idx + 1] *= damping;
            velocities[idx + 2] *= damping;

            // Update Position
            positions[idx] += velocities[idx];
            positions[idx + 1] += velocities[idx + 1];
            positions[idx + 2] += velocities[idx + 2];
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={2.5}
                color="#ffffff"
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </points>
    );
};

export default AntigravityParticles;
