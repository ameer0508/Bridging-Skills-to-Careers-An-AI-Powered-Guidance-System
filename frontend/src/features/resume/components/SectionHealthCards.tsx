import React from 'react';
import { User, Briefcase, FolderGit2, GraduationCap, Target, Award, Trophy, Languages } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export type QualitativeConfidence = 'Very High' | 'High' | 'Medium' | 'Low';

export interface SectionHealthInfo {
  sectionName: string;
  iconName: string;
  score: number;
  status: string;
  qualitativeConfidence: QualitativeConfidence;
  extractionMethod: string;
  description: string;
}

export interface SectionHealthCardsProps {
  sections?: SectionHealthInfo[];
}

export const SectionHealthCards: React.FC<SectionHealthCardsProps> = ({
  sections = []
}) => {
  if (sections.length === 0) {
    return (
      <GlassPanel className="p-6 text-center text-xs text-slate-400 font-mono space-y-2">
        <p className="font-bold text-slate-300">No Section Health Data Available</p>
        <p className="text-[11px] text-slate-500">Upload a PDF or DOCX resume to analyze section health and extraction confidence.</p>
      </GlassPanel>
    );
  }
  const getIcon = (name: string) => {
    switch (name) {
      case 'user': return <User className="w-4 h-4 text-indigo-400" />;
      case 'briefcase': return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'folder': return <FolderGit2 className="w-4 h-4 text-cyan-400" />;
      case 'graduation': return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      case 'target': return <Target className="w-4 h-4 text-amber-400" />;
      case 'award': return <Award className="w-4 h-4 text-rose-400" />;
      case 'trophy': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'languages': return <Languages className="w-4 h-4 text-blue-400" />;
      default: return <Target className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getConfidenceBadge = (confidence: QualitativeConfidence) => {
    switch (confidence) {
      case 'Very High':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'High':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Low':
      default:
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {sections.map((item, idx) => (
        <GlassPanel key={idx} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 rounded-lg border border-white/5">
                {getIcon(item.iconName)}
              </div>
              <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{item.sectionName}</h4>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{item.score}%</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed min-h-[32px]">{item.description}</p>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500 truncate max-w-[110px]" title={item.extractionMethod}>
              {item.extractionMethod}
            </span>
            <span className={`px-2 py-0.5 rounded border font-semibold shrink-0 ${getConfidenceBadge(item.qualitativeConfidence)}`}>
              {item.qualitativeConfidence}
            </span>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
};
