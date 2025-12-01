import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

interface WireframeGlobeProps {
    selectedLayer: "conservative" | "balanced" | "aggressive";
    isExpanded: boolean;
    onLayerSelect: (layer: "conservative" | "balanced" | "aggressive") => void;
    onExpand: (expanded: boolean) => void;
}

function LayeredSphere({ layer, offset, isExpanded }: { layer: number; offset: number; isExpanded: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);

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

    return (
        <Sphere ref={meshRef} args={[2 + layer * 0.3, 32, 32]} position={[0, offset * 0.5, 0]}>
            <meshBasicMaterial
                color={colors[layer]}
                wireframe
                transparent
                opacity={0.6}
            />
        </Sphere>
    );
}

function Scene({ isExpanded }: { isExpanded: boolean }) {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Three layers */}
            <LayeredSphere layer={0} offset={-2} isExpanded={isExpanded} />
            <LayeredSphere layer={1} offset={0} isExpanded={isExpanded} />
            <LayeredSphere layer={2} offset={2} isExpanded={isExpanded} />

            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
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
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <Scene isExpanded={isExpanded} />
            </Canvas>

            {/* Title overlay */}
            <motion.div
                className="absolute top-20 left-1/2 -translate-x-1/2 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <h1 className="text-6xl md:text-8xl font-bold text-cyan-400 mb-4">
                    Blueprints
                </h1>
                <p className="text-xl text-white/60">
                    The Holographic X-Ray of Your DeFi Strategy
                </p>
            </motion.div>
        </div>
    );
}
