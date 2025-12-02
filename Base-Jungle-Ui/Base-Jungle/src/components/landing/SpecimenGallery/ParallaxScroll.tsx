import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import GlassMonolith from './GlassMonolith';
import SelectionOverlay from './SelectionOverlay';

const ParallaxScroll: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // We'll use a manual scroll value instead of native scroll for the hover effect
    const scrollX = useMotionValue(0);
    const springScrollX = useSpring(scrollX, { stiffness: 100, damping: 30 });

    const [activeTier, setActiveTier] = useState<any>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const tiers = [
        { id: 1, name: 'Novice', price: '$100+', multiplier: '1.0x', leverage: 'None' },
        { id: 2, name: 'Scout', price: '$500+', multiplier: '1.1x', leverage: '2.0x' },
        { id: 3, name: 'Captain', price: '$2,000+', multiplier: '1.25x', leverage: '3.0x' },
        { id: 4, name: 'Whale', price: '$10,000+', multiplier: '1.5x', leverage: '5.0x' },
    ];

    // Mouse Navigation Logic
    useEffect(() => {
        let animationFrame: number;
        let currentScroll = 0;
        const maxScroll = (tiers.length - 1) * 400; // Approx width of cards + gap

        const handleMouseMove = (e: MouseEvent) => {
            const width = window.innerWidth;
            const x = e.clientX;

            // Speed factor
            const speed = 15;

            // Right Zone (> 80%)
            if (x > width * 0.8) {
                currentScroll = Math.min(currentScroll + speed, maxScroll);
            }
            // Left Zone (< 20%)
            else if (x < width * 0.2) {
                currentScroll = Math.max(currentScroll - speed, 0);
            }

            scrollX.set(-currentScroll);

            // Update active index based on scroll position
            const newIndex = Math.round(currentScroll / 400);
            if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tiers.length) {
                setActiveIndex(newIndex);
            }
        };

        // We need a loop to keep scrolling while hovering
        const loop = () => {
            // This is a simplified version. For smoother "continuous" scroll while hovering, 
            // we'd need to track mouse position state and update in the loop.
            // Let's attach the listener to window for simplicity in this demo.
        };

        // Better approach for continuous hover scroll:
        let mouseX = 0;
        const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; };

        const updateScroll = () => {
            const width = window.innerWidth;
            const speed = 5; // Pixels per frame

            if (mouseX > width * 0.8) {
                currentScroll = Math.min(currentScroll + speed, maxScroll);
                scrollX.set(-currentScroll);
            } else if (mouseX < width * 0.2) {
                currentScroll = Math.max(currentScroll - speed, 0);
                scrollX.set(-currentScroll);
            }

            // Update active index
            const newIndex = Math.round(currentScroll / 400); // Assuming 400px per item step
            setActiveIndex(Math.min(Math.max(newIndex, 0), tiers.length - 1));

            animationFrame = requestAnimationFrame(updateScroll);
        };

        window.addEventListener('mousemove', onMouseMove);
        animationFrame = requestAnimationFrame(updateScroll);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrame);
        };
    }, [activeIndex]);

    return (
        <section ref={containerRef} className="relative h-screen bg-[#050505] overflow-hidden flex flex-col justify-center">

            {/* Header */}
            <div className="absolute top-12 left-12 z-20 pointer-events-none">
                <h2 className="text-4xl font-bold font-mono text-white">SPECIMEN GALLERY</h2>
                <p className="text-gray-500 font-mono text-sm mt-2">Hover edges to navigate</p>
            </div>

            {/* Navigation Zones Indicators (Optional visual cue) */}
            <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-blue-900/10 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />

            {/* Cards Container */}
            <div className="relative z-10 w-full flex items-center justify-center">
                <motion.div
                    style={{ x: springScrollX }}
                    className="flex gap-32 items-center px-[50vw]" // Start centered
                >
                    {tiers.map((tier, i) => (
                        <div key={tier.id} className="flex-shrink-0">
                            <GlassMonolith
                                tier={tier}
                                isActive={i === activeIndex}
                                onClick={() => setActiveTier(tier)}
                            />
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Selection Overlay (Deposit Interface) */}
            <SelectionOverlay
                activeTier={activeTier}
                onClose={() => setActiveTier(null)}
            />
        </section>
    );
};

export default ParallaxScroll;
