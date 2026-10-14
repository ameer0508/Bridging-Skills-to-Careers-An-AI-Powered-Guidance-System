import React from 'react';
import { Network, Unlock } from 'lucide-react';

import { GlassCard } from '../cards/GlassCard';

export interface OpportunityNode {
  title: string;
  category: string;
  unlockedRole: string;
  impactScore: number;
}

export interface OpportunityMapProps {
  opportunities?: OpportunityNode[];
  className?: string;
}

export const OpportunityMap: React.FC<OpportunityMapProps> = ({
  opportunities = [
    {
      title: 'REST API Architecture',
      category: 'Backend Foundations',
      unlockedRole: 'Full Stack Engineer',
      impactScore: 85,
    },
    {
      title: 'Database Query Optimization',
      category: 'Data Persistence',
      unlockedRole: 'Backend Systems Engineer',
      impactScore: 78,
    },
    {
      title: 'JWT Authentication & Security',
      category: 'Security',
      unlockedRole: 'Security Specialist',
      impactScore: 70,
    },
  ],
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Unlocked Opportunity Map</h3>
            <p className="text-xs text-aurora-muted">
              Future career pathways unlocked by completing current milestones
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {opportunities.map((opp, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2 hover:border-emerald-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">
                {opp.category}
              </span>
              <Unlock className="w-3.5 h-3.5 text-emerald-700" />
            </div>

            <h4 className="text-xs font-bold text-aurora-ink leading-snug">{opp.title}</h4>

            <div className="pt-1 flex items-center justify-between text-[11px] text-aurora-muted border-t border-aurora-line">
              <span>Unlocks: <strong className="text-emerald-700">{opp.unlockedRole}</strong></span>
              <span className="text-emerald-700 font-bold">+{opp.impactScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default OpportunityMap;
