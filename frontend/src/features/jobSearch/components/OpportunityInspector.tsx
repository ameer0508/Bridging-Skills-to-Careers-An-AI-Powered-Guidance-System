import { APPLICATION_STATUS_LABEL, formatJobSalary } from './jobFormat';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Video,
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
      <div className="rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-8 shadow-aurora-md flex flex-col items-center justify-center h-[740px] text-center space-y-3">
        <Building2 className="w-12 h-12 text-aurora-muted" />
        <h3 className="text-base font-bold text-aurora-muted">Select an Opportunity</h3>
        <p className="text-xs text-aurora-muted max-w-sm">
          Click any role from the opportunity stream to inspect the complete job posting, employer requirements, and personal match analysis.
        </p>
      </div>
    );
  }

  const statusOptions = Object.entries(APPLICATION_STATUS_LABEL).map(([id, label]) => ({ id, label }));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 md:p-8 shadow-aurora-md flex flex-col h-[740px] space-y-6">
      {/* Top Header & Employer Brand */}
      <div className="space-y-4 border-b border-aurora-line pb-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="text-[11px] text-aurora-indigo uppercase tracking-wider font-semibold">
              Listing details
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-aurora-ink tracking-tight">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-aurora-muted font-medium">
              <Building2 className="w-4 h-4 text-aurora-muted" />
              <span>{opportunity.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(opportunity)}
              type="button"
              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                isSaved
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-aurora-canvas text-aurora-muted border-aurora-line hover:bg-aurora-canvas hover:text-aurora-indigo'
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
        <div className="flex items-center gap-3 text-xs text-aurora-muted flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-aurora-canvas/60 border border-aurora-line">
            <MapPin className="w-3.5 h-3.5 text-aurora-muted" />
            {opportunity.location || 'Remote'}
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-emerald-700">
            <DollarSign className="w-3.5 h-3.5" />
            {formatJobSalary(opportunity.salary)}
          </span>

          <span className="px-3 py-1 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-aurora-muted">
            {opportunity.employmentType || 'Full-Time'}
          </span>

          {opportunity.remote && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Remote Work
            </span>
          )}

          {isSaved && onUpdateStatus && (
            <div className="flex items-center gap-1.5 bg-aurora-canvas/60 p-1 rounded-xl border border-aurora-line">
              <span className="text-[10px] text-aurora-muted px-1.5">Funnel:</span>
              <select
                aria-label="Application status"
                value={status}
                onChange={(e) => onUpdateStatus(e.target.value)}
                className="px-2 py-0.5 rounded-lg bg-aurora-canvas border-0 text-xs font-semibold text-aurora-indigo focus:outline-none cursor-pointer"
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
            className="flex-1 py-2.5 px-5 rounded-2xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-aurora-ink shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Apply on Original Employer Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => navigate('/interview-agent', { state: { opportunity } })}
            type="button"
            className="py-2.5 px-4 rounded-2xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-xs font-semibold text-aurora-ink flex items-center gap-2 transition cursor-pointer"
            title="Prepare mock technical interview for this opportunity"
          >
            <Video className="w-3.5 h-3.5 text-aurora-violet" />
            <span>Practice Interview</span>
          </button>
        </div>
      </div>

      {/* Scrollable Job Description & Requirements Content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
        {/* Required Skills Inventory */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="space-y-2 p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
            <span className="text-xs uppercase tracking-wider text-aurora-muted font-bold block">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      isMatched
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-aurora-canvas/80 text-aurora-muted border-aurora-line'
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
          <span className="text-xs uppercase tracking-wider text-aurora-muted font-bold block">
            Job Description
          </span>
          <div className="p-5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-muted leading-relaxed space-y-3 font-normal whitespace-pre-line">
            {opportunity.description || 'No detailed description provided by employer feed.'}
          </div>
        </div>

        {/* Source Provider Attribution */}
        <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-[11px] text-aurora-muted">
          <span>Provider: {opportunity.provider || 'not stated'}</span>
          <span>External Ref: {opportunity.externalId}</span>
        </div>
      </div>
    </div>
  );
};

OpportunityInspector.displayName = 'OpportunityInspector';
