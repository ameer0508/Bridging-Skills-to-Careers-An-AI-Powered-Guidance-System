import React from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-aurora-line pb-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo text-[10px] font-bold border border-aurora-violet/25 uppercase">
              {match.careerId.category}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-aurora-ink">
              {match.careerId.title}
            </h2>
            <p className="text-xs text-aurora-muted leading-relaxed max-w-lg">
              {match.careerId.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-display text-2xl font-extrabold text-emerald-700 block">
                {match.matchScore}%
              </span>
              <span className="text-[9px] text-aurora-muted uppercase font-bold">Match Score</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Strengths & Fit Analysis */}
        {match.strengths && match.strengths.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] text-emerald-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Primary Strengths & Match Drivers
            </span>
            <div className="space-y-1.5">
              {match.strengths.map((str, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  {str}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        <div className="space-y-2">
          <span className="text-[10px] text-aurora-muted uppercase tracking-widest font-bold block">
            Matched Skills ({match.matchingSkills?.length || 0})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {match.matchingSkills?.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-aurora-violet" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Critical Missing Skills Gaps */}
        {match.missingSkills && match.missingSkills.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-aurora-line">
            <span className="text-[10px] text-rose-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Skill Gaps ({match.missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Triggers */}
        <div className="pt-4 border-t border-aurora-line flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/roadmap');
            }}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Generate Adaptive Learning Roadmap</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas text-aurora-muted font-bold text-xs border border-aurora-line transition-colors cursor-pointer"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetailModal;
