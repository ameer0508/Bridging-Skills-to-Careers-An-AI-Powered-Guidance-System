import React from 'react';
import { Activity, TrendingUp, Globe, Cpu } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface TechTrendItem {
  tech: string;
  growthYoY: string;
  demandLevel: string;
}

export const defaultTechTrends: TechTrendItem[] = [
  { tech: 'Generative AI & RAG Pipelines', growthYoY: '+45%', demandLevel: 'Critical' },
  { tech: 'Vector Databases (Milvus/Pinecone)', growthYoY: '+52%', demandLevel: 'High' },
  { tech: 'Model Context Protocol (MCP)', growthYoY: '+68%', demandLevel: 'Emerging' },
  { tech: 'Agentic AI Frameworks', growthYoY: '+80%', demandLevel: 'Critical' }
];

export const MarketIntelligencePanel: React.FC<{ trends?: TechTrendItem[] }> = ({
  trends = defaultTechTrends
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Market Intelligence & Emerging Tech Radar</h3>
            <p className="text-xs text-slate-400">Live tech stack adoption velocity and global hiring demand</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          Radar Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((item, idx) => (
          <div key={idx} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Demand Level</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                {item.demandLevel}
              </span>
            </div>

            <h4 className="font-bold text-sm text-white pt-1">{item.tech}</h4>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {item.growthYoY} YoY
              </span>
              <span className="text-[10px] text-slate-500">Accelerated</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
