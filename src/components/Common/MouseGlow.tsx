import React, { useEffect, useRef } from 'react';

/**
 * MouseGlow - A subtle ambient glow effect that follows the cursor
 * Designed for the main app interface (after login) to be less distracting than particles
 */
export const MouseGlow: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const handleMouseMove = (e: MouseEvent) => {
            targetRef.current = { x: e.clientX, y: e.clientY };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Smooth interpolation for softer movement
            const lerp = 0.08;
            mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * lerp;
            mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * lerp;

            const { x, y } = mouseRef.current;

            // Create subtle ambient glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 150);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)'); // Purple center
            gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.04)');
            gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.02)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

            ctx.beginPath();
            ctx.arc(x, y, 150, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Add a secondary smaller glow for depth
            const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, 60);
            innerGradient.addColorStop(0, 'rgba(236, 72, 153, 0.06)'); // Pink inner
            innerGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.02)');
            innerGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');

            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.fillStyle = innerGradient;
            ctx.fill();

            animationRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
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
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ opacity: 0.6 }}
        />
    );
};
