import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import GlassCard from './GlassCard';

interface CrystalFormationProps {
    referrals: {
        direct: number;
        indirect: number;
        total: number;
    };
    tier: string;
}

const CrystalFormation: React.FC<CrystalFormationProps> = ({ referrals, tier }) => {
    // Generate crystal positions based on referral count
    const crystals = useMemo(() => {
        const items = [];
        // Main seed
        items.push({ position: [0, 0, 0], scale: 1.5, color: '#0052FF' });

        // Direct referrals (Level 1 spikes)
        const directCount = Math.min(referrals.direct, 12); // Cap for visual sanity
        for (let i = 0; i < directCount; i++) {
            const angle = (i / directCount) * Math.PI * 2;
            const radius = 1.2;
            items.push({
                position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
                rotation: [0, 0, angle],
                scale: 0.8,
                color: '#00FFFF'
            });
        }

        return items;
    }, [referrals]);

    return (
        <GlassCard position={[-3, 0, 0]} scale={[1, 1, 1]} title="Referrals">
            <group position={[0, -0.5, 0]}>
                <Instances range={crystals.length}>
                    <coneGeometry args={[0.3, 1, 4]} />
                    <meshStandardMaterial
                        color="#0052FF"
                        emissive="#0052FF"
                        emissiveIntensity={0.5}
                        roughness={0.1}
                        metalness={0.8}
                    />

                    {crystals.map((data, i) => (
                        <Instance
                            key={i}
                            position={data.position as any}
                            rotation={data.rotation as any}
                            scale={data.scale}
                        />
                    ))}
                </Instances>
            </group>
        </GlassCard>
    );
};

export default CrystalFormation;
