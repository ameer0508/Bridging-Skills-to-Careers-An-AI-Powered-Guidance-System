import React, { useState } from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface TransferableItem {
  sourceSkill: string;
  inferredCapabilities: string[];
  crossDomainFit: string;
}

const defaultTransferableItems: TransferableItem[] = [
  {
    sourceSkill: 'Python',
    inferredCapabilities: ['Automation Scripting', 'Data Analysis', 'Machine Learning', 'Backend API Architecture'],
    crossDomainFit: 'Data Science, AI & Backend Engineering'
  },
  {
    sourceSkill: 'Linux',
    inferredCapabilities: ['System Administration', 'DevOps Operations', 'Cloud Server Configuration', 'Cybersecurity Defense'],
    crossDomainFit: 'Cloud Infrastructure & Security'
  },
  {
    sourceSkill: 'Docker',
    inferredCapabilities: ['Containerization', 'Microservices Architecture', 'CI/CD Pipeline Integration'],
    crossDomainFit: 'DevOps & Distributed Systems'
  },
  {
    sourceSkill: 'TypeScript',
    inferredCapabilities: ['Type Safety', 'Software Design Patterns', 'Full Stack Frontend & Node.js'],
    crossDomainFit: 'Enterprise Web Engineering'
  }
];

export const TransferableSkillExplorer: React.FC<{ items?: TransferableItem[] }> = ({
  items = defaultTransferableItems
}) => {
  const [selectedSkill, setSelectedSkill] = useState<string>('Python');

  const activeItem = items.find(i => i.sourceSkill === selectedSkill) || items[0];

  return (
    <GlassPanel className="p-6 space-y-6 border-purple-500/30">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-aurora-violet rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Cross-Domain Transferable Skill Explorer</h3>
            <p className="text-xs text-aurora-muted">Infers lateral capabilities unlocked by your core technical foundation</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-aurora-violet text-xs font-bold">
          Transfer Engine v1.2
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SKILL SELECTION TABS */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-xs font-bold text-aurora-muted uppercase tracking-wider block mb-2">
            Select Base Technical Skill:
          </span>
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSkill(item.sourceSkill)}
              className={`w-full p-3 rounded-xl text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                selectedSkill === item.sourceSkill
                  ? 'bg-violet-50 border border-purple-500/50 text-aurora-ink font-bold'
                  : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-muted hover:border-purple-500/30 hover:text-aurora-ink'
              }`}
            >
              <span>{item.sourceSkill}</span>
              <ArrowRight className="w-3.5 h-3.5 text-aurora-violet" />
            </button>
          ))}
        </div>

        {/* INFERRED CAPABILITIES DISPLAY */}
        <div className="md:col-span-8 p-5 bg-aurora-canvas/60 border border-purple-500/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-aurora-line pb-3">
            <span className="text-xs text-aurora-violet font-bold">
              Base Skill: <strong className="text-aurora-ink">{activeItem.sourceSkill}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-aurora-violet">
              Fit: {activeItem.crossDomainFit}
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-aurora-muted block">
              Inferred Lateral Capabilities Unlocked ({activeItem.inferredCapabilities.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeItem.inferredCapabilities.map((cap, cIdx) => (
                <div key={cIdx} className="p-3 bg-aurora-canvas border border-aurora-line rounded-xl text-xs text-aurora-ink flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-aurora-violet shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
