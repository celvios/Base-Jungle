import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SproutAsset, ShardAsset, CoreAsset, WhaleAsset } from './TierAssets';

interface StasisPodProps {
    tier: any;
    isActive: boolean;
    onClick: () => void;
}

const StasisPod: React.FC<StasisPodProps> = ({ tier, isActive, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Parallax Gaze Effect: Look at cursor if active
            if (isActive) {
                const mouse = state.pointer;
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mouse.y * 0.2, 0.1);
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mouse.x * 0.2, 0.1);
            } else {
                // Drift back to neutral
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
            }
        }
    });

    const AssetComponent = () => {
        switch (tier.id) {
            case 1: return <SproutAsset />;
            case 2: return <ShardAsset />;
            case 3: return <CoreAsset />;
            case 4: return <WhaleAsset />; // Mapped Tree -> Whale for visual logic
            default: return <SproutAsset />;
        }
    };

    return (
        <group onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            {/* Glass Cylinder Container */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[1.2, 1.2, 3.5, 32]} />
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
                    color={isActive ? "#0052FF" : "#ffffff"}
                    background={new THREE.Color('#050505')}
                />
            </mesh>

            {/* Internal Asset */}
            <group position={[0, 0, 0]} scale={isActive ? 1.2 : 1}>
                <AssetComponent />
            </group>

            {/* Top/Bottom Caps */}
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -1.8, 0]}>
                <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Data Overlay (Holographic) */}
            {isActive && (
                <group position={[0, -2.5, 0]}>
                    <Text
                        position={[0, 0, 0]}
                        fontSize={0.3}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {tier.name.toUpperCase()}
                    </Text>
                    <Text
                        position={[0, -0.4, 0]}
                        fontSize={0.15}
                        color="#0052FF"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {tier.price}
                    </Text>
                </group>
            )}
        </group>
    );
};

export default StasisPod;
