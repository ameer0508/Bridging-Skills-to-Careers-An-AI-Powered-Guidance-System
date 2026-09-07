import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  baseAngle: number;
  distance: number;
  speed: number;
  color: string;
}

interface AuthIntelligenceFieldProps {
  activeMode?: 'login' | 'register';
}

export const AuthIntelligenceField: React.FC<AuthIntelligenceFieldProps> = ({ activeMode = 'login' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const nodes: Node[] = [
      { id: '1', label: 'Skill Vectors', x: 0, y: 0, baseAngle: 0, distance: 130, speed: 0.003, color: '#22D3EE' },
      { id: '2', label: 'NLP Resume', x: 0, y: 0, baseAngle: Math.PI / 3, distance: 160, speed: 0.002, color: '#818CF8' },
      { id: '3', label: 'Career OS', x: 0, y: 0, baseAngle: (2 * Math.PI) / 3, distance: 120, speed: 0.004, color: '#A855F7' },
      { id: '4', label: 'Market Demand', x: 0, y: 0, baseAngle: Math.PI, distance: 170, speed: 0.0025, color: '#34D399' },
      { id: '5', label: 'Adaptive Roadmap', x: 0, y: 0, baseAngle: (4 * Math.PI) / 3, distance: 140, speed: 0.0035, color: '#F472B6' },
      { id: '6', label: 'Readiness Index', x: 0, y: 0, baseAngle: (5 * Math.PI) / 3, distance: 180, speed: 0.002, color: '#FBBF24' },
    ];

    let angleOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw Orbit Rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      [120, 150, 180].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Central Core
      ctx.save();
      const coreGradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35);
      coreGradient.addColorStop(0, 'rgba(129, 140, 248, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
      coreGradient.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.fill();

      // Core Solid Dot
      ctx.fillStyle = '#818CF8';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!prefersReducedMotion) {
        angleOffset += 0.002;
      }

      // Update and Draw Orbiting Nodes
      nodes.forEach((node) => {
        const currentAngle = node.baseAngle + angleOffset * (node.speed * 200);
        node.x = cx + Math.cos(currentAngle) * node.distance;
        node.y = cy + Math.sin(currentAngle) * node.distance;

        // Line to Center Core
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = activeMode === 'login' ? 'rgba(34, 211, 238, 0.15)' : 'rgba(168, 85, 247, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node Glow
        ctx.save();
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Node Label
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 16);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeMode, prefersReducedMotion]);

  return (
    <div className="relative w-full h-80 sm:h-96 flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-slate-950/20 to-slate-950" />
    </div>
  );
};
