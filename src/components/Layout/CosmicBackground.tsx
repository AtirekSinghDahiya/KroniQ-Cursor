import React, { useEffect, useRef } from 'react';

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const particleCount = 50;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = Math.random() * 3 + 1;
      const startX = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 100;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 10;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${startX}%;
        --drift: ${drift}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${Math.random() * 0.5 + 0.3};
      `;

      canvasRef.current.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return (
    <div className="cosmic-particles" ref={canvasRef} />
  );
};
