import React from 'react';
import { Target, X, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ICareerMatch {
  id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

interface CareerDetailModalProps {
  match: ICareerMatch | null;
  onClose: () => void;
}

export const CareerDetailModal: React.FC<CareerDetailModalProps> = ({ match, onClose }) => {
  const navigate = useNavigate();
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30 uppercase">
              {match.careerId.category}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              {match.careerId.title}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              {match.careerId.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-display text-2xl font-extrabold text-emerald-400 block">
                {match.matchScore}%
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Match Score</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Strengths & Fit Analysis */}
        {match.strengths && match.strengths.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Primary Strengths & Match Drivers
            </span>
            <div className="space-y-1.5">
              {match.strengths.map((str, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                  {str}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
            Verified Matched Skills ({match.matchingSkills?.length || 0})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {match.matchingSkills?.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Critical Missing Skills Gaps */}
        {match.missingSkills && match.missingSkills.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Skill Gaps ({match.missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Triggers */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/roadmap');
            }}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Generate Adaptive Learning Roadmap</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-white/10 transition-colors cursor-pointer"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetailModal;
