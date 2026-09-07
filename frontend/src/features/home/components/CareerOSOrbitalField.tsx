import React, { useEffect, useRef } from 'react';
import { Sparkles, FileText } from 'lucide-react';

interface SkillItem {
  name: string;
  category?: string;
}

interface CareerOSOrbitalFieldProps {
  targetRole?: string;
  userSkills?: SkillItem[];
  onUploadResume?: () => void;
}

interface SkillNode {
  name: string;
  category: string;
  orbitRadius: number;
  speed: number;
  angle: number;
  color: string;
  size: number;
}

export const CareerOSOrbitalField: React.FC<CareerOSOrbitalFieldProps> = ({
  targetRole = 'Target Career Blueprint',
  userSkills = [],
  onUploadResume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || userSkills.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 420);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const colors = ['#22D3EE', '#4F46E5', '#9333EA', '#38BDF8', '#818CF8', '#A855F7', '#34D399'];

    // Map Real User Skills to Orbital Nodes
    const nodes: SkillNode[] = userSkills.slice(0, 10).map((skill, idx) => {
      const radiusStep = 75 + ((idx * 28) % 140);
      const baseSpeed = 0.006 - (idx % 3) * 0.0015;
      const speed = idx % 2 === 0 ? baseSpeed : -baseSpeed;
      const angle = (idx * (Math.PI * 2)) / Math.min(userSkills.length, 10);
      const color = colors[idx % colors.length];

      return {
        name: skill.name,
        category: skill.category || 'Skill',
        orbitRadius: radiusStep,
        speed,
        angle,
        color,
        size: 5 + (idx % 2),
      };
    });

    let pulseTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      pulseTime += 0.03;
      const pulseRadius = 38 + Math.sin(pulseTime) * 4;

      // Draw Orbit Rings
      const uniqueRadii = Array.from(new Set(nodes.map((n) => n.orbitRadius)));
      uniqueRadii.forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Core Glow
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120);
      grad.addColorStop(0, 'rgba(79, 70, 229, 0.35)');
      grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Draw Central Core Node
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      const coreGrad = ctx.createLinearGradient(centerX - 30, centerY - 30, centerX + 30, centerY + 30);
      coreGrad.addColorStop(0, '#4F46E5');
      coreGrad.addColorStop(0.5, '#9333EA');
      coreGrad.addColorStop(1, '#22D3EE');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Central Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(targetRole.length > 18 ? targetRole.slice(0, 16) + '...' : targetRole, centerX, centerY);

      // Draw & Update Skill Nodes
      nodes.forEach((node) => {
        node.angle += node.speed;
        const x = centerX + Math.cos(node.angle) * node.orbitRadius;
        const y = centerY + Math.sin(node.angle) * node.orbitRadius;

        // Vector Connection Line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Circle
        ctx.beginPath();
        ctx.arc(x, y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node Label
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(node.name, x, y + 14);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [targetRole, userSkills]);

  if (userSkills.length === 0) {
    return (
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/70 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="text-sm font-bold text-white">No Skill Vector Nodes Extracted Yet</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your resume or add manual skills to activate your neural orbital skill telemetry.
          </p>
        </div>
        {onUploadResume && (
          <button
            onClick={onUploadResume}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Resume Now</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
          {userSkills.length} Verified Vector Nodes Active
        </span>
      </div>
    </div>
  );
};

export default CareerOSOrbitalField;
