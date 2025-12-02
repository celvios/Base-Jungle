import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    baseY: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

const AntigravityParticles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number>();

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

        // Initialize particles
        const particleCount = 150;
        particlesRef.current = [];

        for (let i = 0; i < particleCount; i++) {
            particlesRef.current.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                baseY: Math.random() * canvas.height,
                vx: 0,
                vy: -0.5 - Math.random() * 0.5, // Float upward
                size: 2 + Math.random() * 3,
                opacity: 0.3 + Math.random() * 0.4
            });
        }

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle) => {
                // Calculate distance from mouse
                const dx = mouseRef.current.x - particle.x;
                const dy = mouseRef.current.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const repelRadius = 150;

                // Repel from mouse
                if (distance < repelRadius) {
                    const force = (repelRadius - distance) / repelRadius;
                    const angle = Math.atan2(dy, dx);
                    particle.vx -= Math.cos(angle) * force * 0.5;
                    particle.vy -= Math.sin(angle) * force * 0.5;
                }

                // Apply antigravity (float up)
                particle.vy -= 0.02;

                // Apply velocity
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Damping
                particle.vx *= 0.95;
                particle.vy *= 0.95;

                // Reset if out of bounds
                if (particle.y < -10) {
                    particle.y = canvas.height + 10;
                    particle.x = Math.random() * canvas.width;
                }
                if (particle.x < -10) particle.x = canvas.width + 10;
                if (particle.x > canvas.width + 10) particle.x = -10;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 82, 255, ${particle.opacity})`;
                ctx.fill();

                // Draw small glow
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 3
                );
                gradient.addColorStop(0, `rgba(0, 82, 255, ${particle.opacity * 0.3})`);
                gradient.addColorStop(1, 'rgba(0, 82, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    particle.x - particle.size * 3,
                    particle.y - particle.size * 3,
                    particle.size * 6,
                    particle.size * 6
                );
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: 'transparent' }}
        />
    );
};

export default AntigravityParticles;
