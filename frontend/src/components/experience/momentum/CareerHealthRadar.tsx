import React from 'react';
import { HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { CareerHealthData } from './CareerHealthEngine';

export interface CareerHealthRadarProps {
  careerHealthData?: CareerHealthData;
  className?: string;
}

export const CareerHealthRadar: React.FC<CareerHealthRadarProps> = ({
  careerHealthData = {
    overallHealthScore: 82,
    dimensions: [
      { dimension: 'Roadmap Velocity', score: 75, rating: 'Optimal', evidence: '40% Progress' },
      { dimension: 'Skill Breadth', score: 80, rating: 'Optimal', evidence: '6 Verified Skills' },
      { dimension: 'Readiness Stability', score: 85, rating: 'Optimal', evidence: '85% Alignment' },
      { dimension: 'Learning Consistency', score: 90, rating: 'Optimal', evidence: 'Active Sessions' },
      { dimension: 'Recommendation Execution', score: 70, rating: 'Healthy', evidence: 'Finished Recs' },
    ],
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Multi-Dimensional Career Health</h3>
            <p className="text-xs text-neutral-400">
              Evaluated across 5 core telemetry dimensions
            </p>
          </div>
        </div>
        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
          {careerHealthData.overallHealthScore}% Overall Health
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {careerHealthData.dimensions.map((dim, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{dim.dimension}</span>
              <span
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                  dim.rating === 'Optimal'
                    ? 'text-emerald-400'
                    : dim.rating === 'Healthy'
                    ? 'text-indigo-400'
                    : 'text-amber-400'
                }`}
              >
                {dim.rating === 'Attention Needed' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {dim.rating}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-indigo-500"
                style={{ width: `${dim.score}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-400 block">{dim.evidence}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default CareerHealthRadar;
