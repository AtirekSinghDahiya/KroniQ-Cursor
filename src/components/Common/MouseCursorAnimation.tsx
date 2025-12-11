import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface MouseTrailParticle {
    id: number;
    x: number;
    y: number;
    opacity: number;
    size: number;
}

export const MouseCursorAnimation: React.FC = () => {
    const { currentTheme } = useTheme();
    const [particles, setParticles] = useState<MouseTrailParticle[]>([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(true);
    const particleIdRef = useRef(0);
    const lastPositionRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>();

    // Determine colors based on theme
    const getTrailColor = () => {
        if (currentTheme === 'cosmic-dark') {
            return {
                primary: '#EC4899',
                secondary: '#8B5CF6',
                glow: 'rgba(236, 72, 153, 0.5)'
            };
        } else {
            return {
                primary: '#10a37f',
                secondary: '#0e8c6f',
                glow: 'rgba(16, 163, 127, 0.5)'
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newX = e.clientX;
            const newY = e.clientY;

            // Calculate distance moved
            const dx = newX - lastPositionRef.current.x;
            const dy = newY - lastPositionRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Add particle if moved enough
            if (distance > 5) {
                lastPositionRef.current = { x: newX, y: newY };
                setMousePosition({ x: newX, y: newY });

                const newParticle: MouseTrailParticle = {
                    id: particleIdRef.current++,
                    x: newX,
                    y: newY,
                    opacity: 1,
                    size: Math.random() * 6 + 4
                };

                setParticles(prev => [...prev.slice(-20), newParticle]);
            }
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Animate particles fading out
    useEffect(() => {
        const animate = () => {
            setParticles(prev =>
                prev
                    .map(p => ({
                        ...p,
                        opacity: p.opacity - 0.03,
                        size: p.size * 0.97
                    }))
                    .filter(p => p.opacity > 0)
            );
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    if (!isVisible) return null;

    const colors = getTrailColor();

    return (
        <div
            className="fixed inset-0 pointer-events-none z-[9999]"
            aria-hidden="true"
        >
            {/* Main cursor glow */}
            <div
                className="absolute rounded-full transition-transform duration-100"
                style={{
                    left: mousePosition.x - 10,
                    top: mousePosition.y - 10,
                    width: 20,
                    height: 20,
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Cursor ring */}
            <div
                className="absolute rounded-full border-2 transition-all duration-150"
                style={{
                    left: mousePosition.x,
                    top: mousePosition.y,
                    width: 32,
                    height: 32,
                    borderColor: colors.primary,
                    opacity: 0.6,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 10px ${colors.glow}`
                }}
            />

            {/* Trail particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        opacity: particle.opacity,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 ${particle.size}px ${colors.glow}`,
                        transition: 'opacity 0.1s ease-out'
                    }}
                />
            ))}

            {/* Inner dot */}
            <div
                className="absolute rounded-full"
                style={{
                    left: mousePosition.x,
                    top: mousePosition.y,
                    width: 6,
                    height: 6,
                    background: colors.primary,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 8px ${colors.primary}`
                }}
            />
        </div>
    );
};

export default MouseCursorAnimation;
