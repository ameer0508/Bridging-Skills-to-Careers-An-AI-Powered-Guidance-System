import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  category: 'skill' | 'project' | 'experience' | 'career' | 'ai';
  color: string;
  glow: string;
  alpha: number;
}

const CATEGORY_STYLES = {
  skill: { color: 'rgba(34, 211, 238, ', glow: '#22D3EE' }, // Cyan
  project: { color: 'rgba(168, 85, 247, ', glow: '#A855F7' }, // Purple
  experience: { color: 'rgba(99, 102, 241, ', glow: '#6366F1' }, // Indigo
  career: { color: 'rgba(52, 211, 153, ', glow: '#34D399' }, // Emerald
  ai: { color: 'rgba(251, 113, 133, ', glow: '#FB7185' }, // Rose
};

const LABELS = [
  'PyTorch', 'FastAPI', 'Vector DB', 'RAG Engine', 'React 19',
  'TypeScript', 'System Architecture', 'Docker', 'NLP spaCy',
  'LLM Guardrails', 'Resume Taxonomy', 'Career Readiness',
  'MLOps Pipeline', 'Kubernetes', 'Embedding Similarity', 'Market Intelligence'
];

interface Props {
  className?: string;
}

export const InteractiveIntelligenceField: React.FC<Props> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    // Initialize nodes
    const nodeCount = Math.min(Math.floor(width / 32), 40);
    const nodes: Node[] = [];
    const categories: Array<keyof typeof CATEGORY_STYLES> = ['skill', 'project', 'experience', 'career', 'ai'];

    for (let i = 0; i < nodeCount; i++) {
      const cat = categories[i % categories.length];
      const style = CATEGORY_STYLES[cat];
      nodes.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (reducedMotion ? 0.05 : 0.35),
        vy: (Math.random() - 0.5) * (reducedMotion ? 0.05 : 0.35),
        radius: Math.random() * 2.5 + 2,
        label: LABELS[i % LABELS.length],
        category: cat,
        color: style.color,
        glow: style.glow,
        alpha: Math.random() * 0.4 + 0.4,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle Cyber Grid Overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 60;
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

      // Update & Draw Connections
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        if (!reducedMotion) {
          nodeA.x += nodeA.vx;
          nodeA.y += nodeA.vy;

          if (nodeA.x < 0) nodeA.x = width;
          if (nodeA.x > width) nodeA.x = 0;
          if (nodeA.y < 0) nodeA.y = height;
          if (nodeA.y > height) nodeA.y = 0;
        }

        // Check cursor proximity
        let isHovered = false;
        if (mouseRef.current.active) {
          const mdx = nodeA.x - mouseRef.current.x;
          const mdy = nodeA.y - mouseRef.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 140) {
            isHovered = true;
          }
        }

        // Draw connections between nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 135;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        // Draw Node Point
        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, isHovered ? nodeA.radius * 1.8 : nodeA.radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeA.color + (isHovered ? 1 : nodeA.alpha) + ')';
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.shadowColor = nodeA.glow;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Node Label if hovered or large node
        if (isHovered || i % 4 === 0) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = isHovered ? '#FFFFFF' : 'rgba(203, 213, 225, 0.65)';
          ctx.fillText(nodeA.label, nodeA.x + 8, nodeA.y + 3);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-80 z-0 ${className}`}
    />
  );
};
