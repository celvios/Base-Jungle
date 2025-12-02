import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AntigravityScene: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 1500; // High particle count
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate initial random positions and velocities
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const x = (Math.random() - 0.5) * 30;
            const y = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 15; // Depth

            // Random rotation speed
            const mx = Math.random() * 0.01;
            const my = Math.random() * 0.01;

            temp.push({ t, factor, speed, x, y, z, mx, my });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();
        const mouse = state.pointer; // Normalized (-1 to 1)

        // Convert mouse to approximate world space at z=0
        const mouseVec = new THREE.Vector3(mouse.x * 15, mouse.y * 10, 0);

        // Scroll factor for "Warp Speed"
        // We read window.scrollY directly for simplicity in this context
        const scrollY = window.scrollY;
        const warpFactor = Math.min(scrollY / 500, 5); // Cap warp speed

        particles.forEach((particle, i) => {
            let { t, factor, speed, x, y, z, mx, my } = particle;

            // 1. Idle Float (Antigravity)
            // Particles drift slowly upwards
            let newY = y + (speed * 2) + (warpFactor * -0.2); // Warp pushes down

            // Reset if too high or too low (looping)
            if (newY > 15) newY = -15;
            if (newY < -15) newY = 15;

            particle.y = newY; // Update state

            // 2. Magnetic Repulsion (Mouse Interaction)
            const dx = x - mouseVec.x;
            const dy = newY - mouseVec.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repulsionRadius = 4;

            let targetX = x;
            let targetY = newY;
            let targetZ = z;

            if (dist < repulsionRadius) {
                const force = (repulsionRadius - dist) * 0.5;
                const angle = Math.atan2(dy, dx);
                targetX += Math.cos(angle) * force;
                targetY += Math.sin(angle) * force;
                targetZ += force * 0.5; // Push back in Z too
            }

            // 3. Update Dummy Object
            dummy.position.set(targetX, targetY, targetZ);

            // Rotation
            dummy.rotation.x = (particle.mx * time * 10);
            dummy.rotation.y = (particle.my * time * 10);
            dummy.rotation.z = time * 0.1;

            // Scale (Pulse slightly)
            const s = 0.5 + Math.sin(t + time) * 0.2;
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            {/* Deconstructed Crystal Shape (Tetrahedron is sharp and techy) */}
            <tetrahedronGeometry args={[0.2, 0]} />
            <meshPhysicalMaterial
                color="#0052FF"
                emissive="#001a4d"
                emissiveIntensity={0.2}
                roughness={0.1}
                metalness={0.1}
                transmission={0.6} // Glass effect
                thickness={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                ior={1.5}
            />
        </instancedMesh>
    );
};

export default AntigravityScene;
