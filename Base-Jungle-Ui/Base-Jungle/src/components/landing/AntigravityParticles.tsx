import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shader material to handle per-particle size
const ParticleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        void main() {
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            float alpha = 1.0 - (r * 2.0);
            alpha = pow(alpha, 1.5); // Soft edge
            gl_FragColor = vec4(color, alpha * 0.8);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const AntigravityParticles: React.FC = () => {
    const { camera } = useThree();
    const pointsRef = useRef<THREE.Points>(null);
    const count = 300; // Fixed count as per requirements

    // Mouse tracking in 3D space
    const mousePosition = useRef(new THREE.Vector3(9999, 9999, 9999)); // Start far away

    // Initialize particles with custom properties
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        // Store custom data that doesn't need to be in the buffer
        const data = new Array(count).fill(0).map(() => {
            const x = (Math.random() - 0.5) * 1200; // -600 to 600
            const y = (Math.random() - 0.5) * 1200; // -600 to 600
            const z = (Math.random() - 0.5) * 800;  // -400 to 400

            return {
                position: new THREE.Vector3(x, y, z),
                originalPosition: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3(0, 0, 0),
                baseSize: 2 + Math.random() * 1.5, // 2-3.5px base
                currentSize: 0,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
            };
        });

        // Initialize buffer arrays
        data.forEach((p, i) => {
            positions[i * 3] = p.position.x;
            positions[i * 3 + 1] = p.position.y;
            positions[i * 3 + 2] = p.position.z;
            sizes[i] = p.baseSize;
        });

        return { positions, sizes, data };
    }, []);

    // Update mouse position
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;

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

    useFrame(() => {
        if (!pointsRef.current) return;

        const geometry = pointsRef.current.geometry;
        const positionAttribute = geometry.attributes.position;
        const sizeAttribute = geometry.attributes.size;

        const interactionRadius = 250;
        const repulsionStrength = 8;
        const damping = 0.92;
        const returnStrength = 0.02;

        particles.data.forEach((particle, i) => {
            // 1. ALWAYS update pulsing animation
            particle.pulsePhase += particle.pulseSpeed;
            const pulseMultiplier = 1 + Math.sin(particle.pulsePhase) * 0.4;
            particle.currentSize = particle.baseSize * pulseMultiplier;

            // 2. Calculate distance to mouse
            const dist = particle.position.distanceTo(mousePosition.current);

            // 3. Apply expansion based on proximity
            let finalSize = particle.currentSize;
            if (dist < interactionRadius) {
                const proximityFactor = Math.pow(1 - (dist / interactionRadius), 2);
                const expansionMultiplier = 1 + (proximityFactor * 3); // Max 4x size
                finalSize = particle.currentSize * expansionMultiplier;
            }

            // 4. Apply repulsion force to velocity
            if (dist < interactionRadius) {
                const forceStrength = Math.pow((interactionRadius - dist) / interactionRadius, 2);
                const direction = new THREE.Vector3()
                    .subVectors(particle.position, mousePosition.current)
                    .normalize();

                const repulsionForce = direction.multiplyScalar(forceStrength * repulsionStrength);
                particle.velocity.add(repulsionForce);
            }

            // 5. Gentle pull back to original position
            const toOriginal = new THREE.Vector3()
                .subVectors(particle.originalPosition, particle.position)
                .multiplyScalar(returnStrength);
            particle.velocity.add(toOriginal);

            // 6. Apply velocity and damping
            particle.position.add(particle.velocity);
            particle.velocity.multiplyScalar(damping);

            // 7. Update geometry arrays
            positionAttribute.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
            sizeAttribute.setX(i, finalSize);
        });

        positionAttribute.needsUpdate = true;
        sizeAttribute.needsUpdate = true;
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
                <bufferAttribute
                    attach="attributes-size"
                    count={count}
                    array={particles.sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <primitive object={ParticleMaterial} attach="material" />
        </points>
    );
};

export default AntigravityParticles;
