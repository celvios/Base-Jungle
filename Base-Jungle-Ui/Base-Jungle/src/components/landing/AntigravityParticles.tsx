import React, { useEffect, useRef, useState } from 'react';

interface Particle {
    angle: number;
    distance: number;
    targetDistance: number;
    size: number;
    opacity: number;
}

const AntigravityParticles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000, isHovering: false });
    const animationRef = useRef<number>();
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize particles in octagon formation
        const particleCount = 8; // 8 points for octagon
        particlesRef.current = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            particlesRef.current.push({
                angle,
                distance: 0,
                targetDistance: 60 + Math.random() * 20, // Distance from cursor
                size: 3 + Math.random() * 4,
                opacity: 0
            });
        }

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, isHovering: true };
            setIsHovering(true);
        };

        const handleMouseLeave = () => {
            setIsHovering(false);
            mouseRef.current.isHovering = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            particlesRef.current.forEach((particle, index) => {
                // Smoothly grow/shrink particles based on hover state
                if (mouse.isHovering) {
                    particle.distance += (particle.targetDistance - particle.distance) * 0.1;
                    particle.opacity += (0.8 - particle.opacity) * 0.1;
                } else {
                    particle.distance += (0 - particle.distance) * 0.1;
                    particle.opacity += (0 - particle.opacity) * 0.1;
                }

                // Calculate position in octagon formation
                const x = mouse.x + Math.cos(particle.angle) * particle.distance;
                const y = mouse.y + Math.sin(particle.angle) * particle.distance;

                // Draw particle
                if (particle.opacity > 0.01) {
                    ctx.beginPath();
                    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 82, 255, ${particle.opacity})`;
                    ctx.fill();

                    // Draw glow
                    const gradient = ctx.createRadialGradient(
                        x, y, 0,
                        x, y, particle.size * 4
                    );
                    gradient.addColorStop(0, `rgba(0, 130, 255, ${particle.opacity * 0.5})`);
                    gradient.addColorStop(1, 'rgba(0, 82, 255, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        x - particle.size * 4,
                        y - particle.size * 4,
                        particle.size * 8,
                        particle.size * 8
                    );

                    // Draw connecting lines to form octagon shape
                    if (index < particlesRef.current.length - 1) {
                        const nextParticle = particlesRef.current[index + 1];
                        const nextX = mouse.x + Math.cos(nextParticle.angle) * nextParticle.distance;
                        const nextY = mouse.y + Math.sin(nextParticle.angle) * nextParticle.distance;

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(nextX, nextY);
                        ctx.strokeStyle = `rgba(0, 82, 255, ${particle.opacity * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else {
                        // Connect last particle to first
                        const firstParticle = particlesRef.current[0];
                        const firstX = mouse.x + Math.cos(firstParticle.angle) * firstParticle.distance;
                        const firstY = mouse.y + Math.sin(firstParticle.angle) * firstParticle.distance;

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(firstX, firstY);
                        ctx.strokeStyle = `rgba(0, 82, 255, ${particle.opacity * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ background: 'transparent' }}
        />
    );
};

export default AntigravityParticles;
