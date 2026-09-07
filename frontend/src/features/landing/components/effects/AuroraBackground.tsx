import React, { useEffect, useRef } from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showParticles?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  className = '',
  showParticles = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor(width / 25), 45);
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = [
      'rgba(99, 102, 241, ', // Indigo
      'rgba(168, 85, 247, ', // Purple
      'rgba(14, 165, 233, ', // Sky/Cyan
      'rgba(59, 130, 246, ', // Blue
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color + '0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - dist / 110) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showParticles]);

  return (
    <div className={`relative overflow-hidden bg-slate-950 text-slate-100 ${className}`}>
      {/* Aurora Ambient Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] left-[15%] h-137.5 w-137.5 rounded-full opacity-35 blur-[120px] filter animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, rgba(168, 85, 247, 0.4) 50%, rgba(0,0,0,0) 70%)',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute top-[30%] right-[-10%] h-150 w-150 rounded-full opacity-30 blur-[130px] filter animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.5) 0%, rgba(99, 102, 241, 0.4) 50%, rgba(0,0,0,0) 70%)',
            animationDuration: '11s',
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[25%] h-125 w-125 rounded-full opacity-25 blur-[110px] filter animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(124, 58, 237, 0.3) 50%, rgba(0,0,0,0) 70%)',
            animationDuration: '9s',
          }}
        />
      </div>

      {showParticles && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70 z-0"
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};
