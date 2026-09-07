import React from 'react';
import { Zap, TrendingUp, Cpu, Sparkles } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface EmergingTechItem {
  name: string;
  category: string;
  growthTrend: string;
  marketCategory: string;
  isExtracted: boolean;
}

export const defaultEmergingTech: EmergingTechItem[] = [
  { name: 'Generative AI & LLMs', category: 'AI / ML', growthTrend: '+45% YoY Demand', marketCategory: 'Next-Gen AI Stack', isExtracted: true },
  { name: 'RAG Pipelines & Embeddings', category: 'AI / ML', growthTrend: '+52% YoY Demand', marketCategory: 'Next-Gen AI Stack', isExtracted: true },
  { name: 'Vector Databases (Milvus/Pinecone)', category: 'Databases', growthTrend: '+60% YoY Demand', marketCategory: 'Next-Gen AI Stack', isExtracted: true },
  { name: 'Model Context Protocol (MCP)', category: 'AI Architecture', growthTrend: '+78% YoY Growth', marketCategory: 'Emerging Protocol', isExtracted: false },
  { name: 'Agentic AI Workflows', category: 'AI Systems', growthTrend: '+85% YoY Growth', marketCategory: 'Autonomous Agents', isExtracted: false },
  { name: 'Rust High-Performance Systems', category: 'Languages', growthTrend: '+35% YoY Growth', marketCategory: 'Modern Systems Stack', isExtracted: false }
];

export const EmergingSkillSpotlight: React.FC<{ items?: EmergingTechItem[] }> = ({
  items = defaultEmergingTech
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-amber-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Emerging Technology & Next-Gen Stack Spotlight</h3>
            <p className="text-xs text-slate-400">Identifies cutting-edge AI protocols, vector databases, and modern developer tools</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
          Market Radar Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((tech, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border space-y-2 transition-all ${
              tech.isExtracted
                ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-slate-950/60 border-white/5 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{tech.category}</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                tech.isExtracted ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
              }`}>
                {tech.isExtracted ? 'Verified in Skillset' : 'Target Emerging Skill'}
              </span>
            </div>

            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{tech.name}</span>
            </h4>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {tech.growthTrend}
              </span>
              <span className="text-slate-500">{tech.marketCategory}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
