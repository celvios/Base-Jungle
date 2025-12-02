import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Stars, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

interface MycelialNetworkProps {
    directCount: number;
    indirectCount: number;
}

const CrystalNode = ({ position, scale, color }: { position: [number, number, number], scale: number, color: string }) => {
    return (
        <group position={position} scale={scale}>
            <mesh>
                <octahedronGeometry args={[1, 0]} />
                <meshPhysicalMaterial
                    color={color}
                    transmission={0.6}
                    thickness={2}
                    roughness={0.1}
                    ior={1.5}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>
            <pointLight color={color} distance={3} intensity={2} />
        </group>
    );
};

const NetworkScene: React.FC<MycelialNetworkProps> = ({ directCount, indirectCount }) => {
    const nodes = useMemo(() => {
        const items = [];
        // Core Seed
        items.push({ position: [0, 0, 0], scale: 2, color: '#0052FF', type: 'core' });

        // Layer 1: Direct Referrals
        const layer1Radius = 4;
        const layer1Count = Math.min(directCount, 20); // Cap for visuals
        for (let i = 0; i < layer1Count; i++) {
            const phi = Math.acos(-1 + (2 * i) / layer1Count);
            const theta = Math.sqrt(layer1Count * Math.PI) * phi;

            const x = layer1Radius * Math.cos(theta) * Math.sin(phi);
            const y = layer1Radius * Math.sin(theta) * Math.sin(phi);
            const z = layer1Radius * Math.cos(phi);

            items.push({ position: [x, y, z], scale: 0.8, color: '#00FFFF', type: 'direct' });
        }

        // Layer 2: Indirect Referrals (simplified distribution)
        const layer2Radius = 7;
        const layer2Count = Math.min(indirectCount, 40);
        for (let i = 0; i < layer2Count; i++) {
            const phi = Math.acos(-1 + (2 * i) / layer2Count);
            const theta = Math.sqrt(layer2Count * Math.PI) * phi;

            const x = layer2Radius * Math.cos(theta) * Math.sin(phi);
            const y = layer2Radius * Math.sin(theta) * Math.sin(phi);
            const z = layer2Radius * Math.cos(phi);

            items.push({ position: [x, y, z], scale: 0.5, color: '#8888FF', type: 'indirect' });
        }

        return items;
    }, [directCount, indirectCount]);

    return (
        <group>
            {nodes.map((node, i) => (
                <Float key={i} speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
                    <CrystalNode
                        position={node.position as [number, number, number]}
                        scale={node.scale}
                        color={node.color}
                    />
                    {/* Connections to center for direct nodes */}
                    {node.type === 'direct' && (
                        <line>
                            <bufferGeometry attach="geometry" onUpdate={geo => {
                                const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...node.position as [number, number, number])];
                                geo.setFromPoints(points);
                            }} />
                            <lineBasicMaterial attach="material" color="#0052FF" transparent opacity={0.2} />
                        </line>
                    )}
                </Float>
            ))}
        </group>
    );
};

const MycelialNetwork: React.FC<MycelialNetworkProps> = (props) => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 10, 30]} />

                <Suspense fallback={null}>
                    <NetworkScene {...props} />
                    <Environment preset="city" />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                </Suspense>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={5}
                    maxDistance={20}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
};

export default MycelialNetwork;
