import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import StasisPod from './StasisPod';

interface CarouselProps {
    tiers: any[];
    activeIndex: number;
    onSelect: (index: number) => void;
}

const Carousel: React.FC<CarouselProps> = ({ tiers, activeIndex, onSelect }) => {
    const groupRef = useRef<THREE.Group>(null);
    const radius = 6; // Radius of the ring
    const count = tiers.length;
    const angleStep = (Math.PI * 2) / count;

    // Spring physics for rotation
    const { rotation } = useSpring({
        rotation: activeIndex * angleStep,
        config: config.molasses, // Heavy, inertial feel
    });

    return (
        <animated.group
            ref={groupRef}
            rotation-y={rotation}
            position={[0, 0, -2]} // Push back slightly
        >
            {tiers.map((tier, i) => {
                const angle = i * angleStep;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;

                // Calculate if this pod is the active one (closest to front)
                // Note: This is a simplified check. In a real rotating system we'd check the rotation prop.
                const isActive = i === activeIndex;

                return (
                    <group
                        key={tier.id}
                        position={[x, 0, z]}
                        rotation={[0, angle, 0]}
                    >
                        <StasisPod
                            tier={tier}
                            isActive={isActive}
                            onClick={() => onSelect(i)}
                        />
                    </group>
                );
            })}
        </animated.group>
    );
};

export default Carousel;
