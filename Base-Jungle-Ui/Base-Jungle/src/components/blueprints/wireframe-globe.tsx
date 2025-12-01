import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface WireframeGlobeProps {
    selectedLayer: "conservative" | "balanced" | "aggressive";
    isExpanded: boolean;
    onLayerSelect: (layer: "conservative" | "balanced" | "aggressive") => void;
    onExpand: (expanded: boolean) => void;
}

function LayeredSphere({
    layer,
    offset,
    isExpanded,
    isSelected,
    onClick
}: {
    layer: number;
    offset: number;
    isExpanded: boolean;
    isSelected: boolean;
    onClick: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;

            // Expand animation
            if (isExpanded) {
                meshRef.current.position.y = offset * 3;
            } else {
                meshRef.current.position.y = offset * 0.5;
            }
        }
    });

    const colors = ["#10b981", "#3b82f6", "#ef4444"]; // green, blue, red
    const color = colors[layer];

    return (
        <Sphere
            ref={meshRef}
            args={[2 + layer * 0.3, 32, 32]}
            position={[0, offset * 0.5, 0]}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <meshBasicMaterial
                color={color}
                wireframe
                transparent
                opacity={isSelected ? 0.9 : hovered ? 0.7 : 0.5}
            />
            {/* Holographic glow effect */}
            <Sphere args={[2 + layer * 0.3 + 0.1, 32, 32]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.2 : 0.05}
                    side={THREE.BackSide}
                />
            </Sphere>
        </Sphere>
    );
}

function Scene({
    isExpanded,
    selectedLayer,
    onLayerSelect
}: {
    isExpanded: boolean;
    selectedLayer: "conservative" | "balanced" | "aggressive";
    onLayerSelect: (layer: "conservative" | "balanced" | "aggressive") => void;
}) {
    const layerMap = { conservative: 0, balanced: 1, aggressive: 2 };
    const selectedIndex = layerMap[selectedLayer];

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22d3ee" />

            {/* Three layers */}
            <LayeredSphere
                layer={0}
                offset={-2}
                isExpanded={isExpanded}
                isSelected={selectedIndex === 0}
                onClick={() => onLayerSelect("conservative")}
            />
            <LayeredSphere
                layer={1}
                offset={0}
                isExpanded={isExpanded}
                isSelected={selectedIndex === 1}
                onClick={() => onLayerSelect("balanced")}
            />
            <LayeredSphere
                layer={2}
                offset={2}
                isExpanded={isExpanded}
                isSelected={selectedIndex === 2}
                onClick={() => onLayerSelect("aggressive")}
            />

            <OrbitControls
                enableZoom={true}
                autoRotate
                autoRotateSpeed={0.5}
                minDistance={5}
                maxDistance={15}
            />
        </>
    );
}

export function WireframeGlobe({ selectedLayer, isExpanded, onLayerSelect, onExpand }: WireframeGlobeProps) {
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY > 200 && !isExpanded) {
                onExpand(true);
            } else if (scrollY <= 200 && isExpanded) {
                onExpand(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isExpanded, onExpand]);

    return (
        <div className="w-full h-full absolute inset-0">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <Scene
                    isExpanded={isExpanded}
                    selectedLayer={selectedLayer}
                    onLayerSelect={onLayerSelect}
                />
            </Canvas>

            {/* Title overlay */}
            <motion.div
                className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <h1 className="text-6xl md:text-8xl font-bold text-cyan-400 mb-4" style={{
                    textShadow: '0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(6, 182, 212, 0.4)'
                }}>
                    Blueprints
                </h1>
                <p className="text-xl text-white/60">
                    The Holographic X-Ray of Your DeFi Strategy
                </p>
            </motion.div>

            {/* Interaction hint */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.div
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <p className="text-sm text-cyan-400">
                            ✨ Click layers to select • Scroll to expand • Drag to rotate
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
