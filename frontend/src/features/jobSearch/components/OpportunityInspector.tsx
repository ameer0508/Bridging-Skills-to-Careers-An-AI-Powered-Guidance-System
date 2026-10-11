import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Globe,
  DollarSign,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Layers,
  FileText,
  ShieldCheck,
  Video,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { OpportunityItem } from './OpportunityStreamFeed';

export interface OpportunityInspectorProps {
  opportunity: OpportunityItem | null;
  isSaved: boolean;
  onToggleSave: (opp: OpportunityItem) => void;
  onUpdateStatus?: (status: string) => void;
  status?: string;
}

export const OpportunityInspector: React.FC<OpportunityInspectorProps> = ({
  opportunity,
  isSaved,
  onToggleSave,
  onUpdateStatus,
  status = 'saved',
}) => {
  const navigate = useNavigate();

  if (!opportunity) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center h-[740px] text-center space-y-3">
        <Building2 className="w-12 h-12 text-slate-600" />
        <h3 className="text-base font-bold text-slate-300">Select an Opportunity</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Click any role from the opportunity stream to inspect the complete job posting, employer requirements, and personal match analysis.
        </p>
      </div>
    );
  }

  const formatSalary = (salary: any) => {
    if (!salary) return 'Market Benchmark Benchmark';
    if (typeof salary === 'string') return salary;
    if (salary.min && salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()} ${salary.currency || 'USD'}`;
    }
    if (salary.min) return `From $${salary.min.toLocaleString()}`;
    return 'Competitive';
  };

  const statusOptions = [
    { id: 'saved', label: 'Saved' },
    { id: 'applied', label: 'Applied' },
    { id: 'interviewing', label: 'Interviewing' },
    { id: 'offer', label: 'Offer' },
    { id: 'rejected', label: 'Archived' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col h-[740px] space-y-6">
      {/* Top Header & Employer Brand */}
      <div className="space-y-4 border-b border-white/5 pb-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
              Live Opportunity Inspection
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{opportunity.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(opportunity)}
              type="button"
              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save Role</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metadata Chips: Location, Salary, Employment Type, Status */}
        <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {opportunity.location || 'Remote'}
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            {formatSalary(opportunity.salary)}
          </span>

          <span className="px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-slate-400">
            {opportunity.employmentType || 'Full-Time'}
          </span>

          {opportunity.remote && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              Remote Work
            </span>
          )}

          {isSaved && onUpdateStatus && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-mono text-slate-500 px-1.5">Funnel:</span>
              <select
                value={status}
                onChange={(e) => onUpdateStatus(e.target.value)}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border-0 text-xs font-mono font-semibold text-indigo-300 focus:outline-none cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Primary Application Action Button */}
        <div className="flex items-center gap-3 pt-2">
          <a
            href={opportunity.applicationUrl || `https://www.google.com/search?q=${encodeURIComponent(`${opportunity.title} ${opportunity.company} jobs`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Apply on Original Employer Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => navigate('/interview-agent', { state: { opportunity } })}
            type="button"
            className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer"
            title="Prepare mock technical interview for this opportunity"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Practice Interview</span>
          </button>
        </div>
      </div>

      {/* Scrollable Job Description & Requirements Content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
        {/* Required Skills Inventory */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Extracted Employer Requirements
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {opportunity.skills.map((skill, sIdx) => {
                const isMatched = opportunity.matchedSkills?.some(
                  (ms) => ms.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={sIdx}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                      isMatched
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/50'
                    }`}
                  >
                    {skill} {isMatched && '✓'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Job Description */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Job Description
          </span>
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed space-y-3 font-normal whitespace-pre-line">
            {opportunity.description || 'No detailed description provided by employer feed.'}
          </div>
        </div>

        {/* Source Provider Attribution */}
        <div className="p-3 rounded-xl bg-slate-950/30 border border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Provider: {opportunity.provider || 'JSearch Index'}</span>
          <span>External Ref: {opportunity.externalId}</span>
        </div>
      </div>
    </div>
  );
};

OpportunityInspector.displayName = 'OpportunityInspector';
