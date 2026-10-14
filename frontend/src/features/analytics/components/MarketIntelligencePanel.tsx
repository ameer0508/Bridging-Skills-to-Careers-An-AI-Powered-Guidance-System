import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface TechTrendItem {
  tech: string;
  growthYoY: string;
  demandLevel: string;
}

const defaultTechTrends: TechTrendItem[] = [
  { tech: 'Generative AI & RAG Pipelines', growthYoY: '+45%', demandLevel: 'Critical' },
  { tech: 'Vector Databases (Milvus/Pinecone)', growthYoY: '+52%', demandLevel: 'High' },
  { tech: 'Model Context Protocol (MCP)', growthYoY: '+68%', demandLevel: 'Emerging' },
  { tech: 'Agentic AI Frameworks', growthYoY: '+80%', demandLevel: 'Critical' }
];

export const MarketIntelligencePanel: React.FC<{ trends?: TechTrendItem[] }> = ({
  trends = defaultTechTrends
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-aurora-violet/25">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-aurora-violet/[0.06] text-aurora-violet rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Market Intelligence & Emerging Tech Radar</h3>
            <p className="text-xs text-aurora-muted">Live tech stack adoption velocity and global hiring demand</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet text-xs font-bold">
          Radar Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((item, idx) => (
          <div key={idx} className="p-4 bg-aurora-canvas/60 border border-aurora-line rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-aurora-muted uppercase font-bold">Demand Level</span>
              <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-violet text-[10px] font-bold border border-aurora-violet/25">
                {item.demandLevel}
              </span>
            </div>

            <h4 className="font-bold text-sm text-aurora-ink pt-1">{item.tech}</h4>

            <div className="pt-2 border-t border-aurora-line flex items-center justify-between">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {item.growthYoY} YoY
              </span>
              <span className="text-[10px] text-aurora-muted">Accelerated</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
