import React, { useEffect, useRef } from 'react';

interface TrailPoint {
    x: number;
    y: number;
    age: number;
}

export const MouseParticles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trailRef = useRef<TrailPoint[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
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
            mouseRef.current = { x: e.clientX, y: e.clientY };

            // Add new point to trail
            trailRef.current.push({
                x: e.clientX,
                y: e.clientY,
                age: 0
            });

            // Keep trail length manageable
            if (trailRef.current.length > 25) {
                trailRef.current.shift();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw trail
            trailRef.current = trailRef.current.filter(point => {
                point.age++;
                return point.age < 30;
            });

            // Draw smooth gradient trail
            if (trailRef.current.length > 1) {
                for (let i = 1; i < trailRef.current.length; i++) {
                    const current = trailRef.current[i];
                    const prev = trailRef.current[i - 1];

                    const progress = i / trailRef.current.length;
                    const fadeOut = 1 - (current.age / 30);
                    const opacity = progress * fadeOut * 0.6;
                    const size = progress * 8 * fadeOut;

                    if (opacity > 0 && size > 0) {
                        // Gradient from pink to purple along the trail
                        const hue = 300 + (progress * 40); // 300 (magenta) to 340 (pink)

                        // Glow effect
                        const gradient = ctx.createRadialGradient(
                            current.x, current.y, 0,
                            current.x, current.y, size * 3
                        );
                        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${opacity})`);
                        gradient.addColorStop(0.4, `hsla(${hue}, 100%, 60%, ${opacity * 0.5})`);
                        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

                        ctx.beginPath();
                        ctx.arc(current.x, current.y, size * 3, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();

                        // Connect with line
                        if (i > 0) {
                            ctx.beginPath();
                            ctx.moveTo(prev.x, prev.y);
                            ctx.lineTo(current.x, current.y);
                            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacity * 0.4})`;
                            ctx.lineWidth = size * 0.5;
                            ctx.lineCap = 'round';
                            ctx.stroke();
                        }
                    }
                }
            }

            // Draw cursor glow
            if (trailRef.current.length > 0) {
                const latest = trailRef.current[trailRef.current.length - 1];
                const glowGradient = ctx.createRadialGradient(
                    latest.x, latest.y, 0,
                    latest.x, latest.y, 20
                );
                glowGradient.addColorStop(0, 'hsla(330, 100%, 70%, 0.4)');
                glowGradient.addColorStop(0.5, 'hsla(320, 100%, 60%, 0.15)');
                glowGradient.addColorStop(1, 'hsla(310, 100%, 50%, 0)');

                ctx.beginPath();
                ctx.arc(latest.x, latest.y, 20, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();
            }

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
            className="fixed inset-0 pointer-events-none z-10"
            style={{ opacity: 0.8 }}
        />
    );
};
