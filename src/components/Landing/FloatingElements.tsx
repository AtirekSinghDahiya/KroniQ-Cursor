import React, { useEffect, useRef } from 'react';

export const FloatingElements: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 30, 99, ${particle.opacity})`;
        ctx.fill();

        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(233, 30, 99, ${0.1 * (1 - distance / 150)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export const Floating3DCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  return (
    <div
      className="floating-card-wrapper"
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0
      }}
    >
      <div className="floating-card-inner">
        {children}
      </div>
    </div>
  );
};

export const AnimatedGradientOrb: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute ${className} pointer-events-none`}>
      <div className="relative w-full h-full will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/30 to-[#EC4899]/30 rounded-full blur-3xl animate-pulse-slow" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute inset-0 bg-gradient-to-tl from-[#8B5CF6]/20 to-[#FF6B35]/20 rounded-full blur-2xl animate-spin-slow" style={{ transform: 'translateZ(0)' }} />
      </div>
    </div>
  );
};
