import { formatPostedDate } from './jobFormat';
import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Search,
} from 'lucide-react';

export interface OpportunityItem {
  externalId: string;
  provider: string;
  title: string;
  company: string;
  description: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salary?: { min?: number; max?: number; currency?: string; period?: string } | string | null;
  /** Null when the provider did not state a posting date. */
  postedAt: string | Date | null;
  applicationUrl: string;
  skills: string[];
  skillbridgeMatchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  matchExplanation?: string;
  matchStatus?: 'SCORED' | 'NO_REQUIREMENTS' | 'NO_CANDIDATE_EVIDENCE';
  /** True for built-in demo listings (no live provider configured). */
  isSample?: boolean;
  /** From the server: how old the listing is by the source's own date, or that it is a sample or undated. */
  freshness?: { status: 'new' | 'recent' | 'old' | 'undated' | 'sample'; ageDays: number | null; label: string };
  status?: string;
  // Tracking fields, present on saved jobs
  notes?: string;
  reminderAt?: string | null;
  reminderNote?: string;
  reminderDue?: boolean;
  appliedAt?: string;
  statusHistory?: Array<{ status: string; changedAt: string; note?: string }>;
  _id?: string;
}

export interface OpportunityStreamFeedProps {
  activeTab: 'LIVE' | 'SAVED';
  onTabChange: (tab: 'LIVE' | 'SAVED') => void;
  liveOpportunities: OpportunityItem[];
  savedOpportunities: OpportunityItem[];
  selectedId?: string;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  savedExternalIds: Set<string>;
  onToggleSave: (opp: OpportunityItem, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const OpportunityStreamFeed: React.FC<OpportunityStreamFeedProps> = ({
  activeTab,
  onTabChange,
  liveOpportunities,
  savedOpportunities,
  selectedId,
  onSelectOpportunity,
  savedExternalIds,
  onToggleSave,
  isLoading,
}) => {
  const currentList = activeTab === 'LIVE' ? liveOpportunities : savedOpportunities;

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return { label: 'Applied', color: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25' };
      case 'interviewing':
        return { label: 'Interviewing', color: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25' };
      case 'offer':
        return { label: 'Offer Received', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected':
        return { label: 'Archived', color: 'bg-aurora-canvas text-aurora-muted border-slate-700' };
      default:
        return { label: 'Saved', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-5 md:p-6 shadow-aurora-md backdrop-blur-xl flex flex-col h-[740px]">
      {/* Header Tabs: Live vs Saved */}
      <div className="flex items-center justify-between border-b border-aurora-line pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 bg-aurora-canvas/60 p-1 rounded-2xl border border-aurora-line">
          <button
            type="button"
            onClick={() => onTabChange('LIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LIVE'
                ? 'text-aurora-ink [background:var(--aurora-gradient-action)] shadow-aurora-sm'
                : 'text-aurora-muted hover:text-aurora-ink'
            }`}
          >
            <span>Live Stream</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-aurora-indigo">
              {liveOpportunities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('SAVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SAVED'
                ? 'text-aurora-ink [background:var(--aurora-gradient-action)] shadow-aurora-sm'
                : 'text-aurora-muted hover:text-aurora-ink'
            }`}
          >
            <span>Tracked Pipeline</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-aurora-indigo">
              {savedOpportunities.length}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-aurora-muted">
          {currentList.length} {currentList.length === 1 ? 'Role' : 'Roles'}
        </span>
      </div>

      {/* Opportunity Stream List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-aurora-muted">Querying Opportunity Stream...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2 mt-12">
            <Search className="w-8 h-8 text-aurora-muted mx-auto" />
            <p className="text-sm font-semibold text-aurora-muted">
              {activeTab === 'LIVE' ? 'No live opportunities found' : 'No tracked jobs yet'}
            </p>
            <p className="text-xs text-aurora-muted max-w-xs mx-auto">
              {activeTab === 'LIVE'
                ? 'Try broadening your search keywords or location criteria in the command center.'
                : 'Bookmark opportunities from the live stream to track them in your application funnel.'}
            </p>
          </div>
        ) : (
          currentList.map((opp, idx) => {
            const isSelected = selectedId === opp.externalId;
            const isSaved = savedExternalIds.has(opp.externalId);
            const statusBadge = opp.status ? getStatusBadge(opp.status) : null;

            return (
              <motion.div
                key={opp.externalId || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                onClick={() => onSelectOpportunity(opp)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'border-aurora-violet/25 bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_60%)] shadow-lg shadow-indigo-500/10'
                    : 'border-aurora-line bg-aurora-canvas/60 hover:border-aurora-line hover:bg-aurora-canvas/60'
                }`}
              >
                {/* Active indicator border bar */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                )}

                {/* Top Row: Title + Save Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-aurora-ink tracking-tight truncate group-hover:text-aurora-indigo transition">
                      {opp.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-aurora-muted">
                      <span className="font-semibold text-aurora-ink truncate flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-aurora-muted" />
                        {opp.company}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Match Score Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                      <CheckCircle2 className="w-3 h-3 text-aurora-indigo" />
                      {opp.skillbridgeMatchScore === null ? 'Not scored' : `${opp.skillbridgeMatchScore}%`}
                    </span>

                    {/* Bookmark Save Action */}
                    <button
                      type="button"
                      onClick={(e) => onToggleSave(opp, e)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-aurora-canvas text-aurora-muted border-aurora-line hover:text-aurora-indigo hover:bg-aurora-canvas'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-400/30" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Middle Row: Location, Remote, Time */}
                <div className="flex items-center gap-3 text-xs text-aurora-muted flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-aurora-muted" />
                    {opp.location || 'Remote'}
                  </span>

                  {opp.remote && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Remote
                    </span>
                  )}

                  <span
                    className={`flex items-center gap-1 text-[11px] ${opp.freshness?.status === 'old' ? 'text-amber-700' : 'text-aurora-muted'}`}
                    data-testid="job-freshness"
                    data-freshness={opp.freshness?.status ?? ''}
                    title={opp.freshness?.label}
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {/* A sample listing's date belongs to the demonstration, so no age is shown for it */}
                    {opp.freshness
                      ? opp.freshness.status === 'sample'
                        ? 'Sample listing, no real date'
                        : opp.freshness.label
                      : formatPostedDate(opp.postedAt)}
                  </span>

                  {statusBadge && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Matched Skills Chips */}
                {opp.matchedSkills && opp.matchedSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-aurora-line">
                    <span className="text-[10px] text-aurora-muted">Matched:</span>
                    {opp.matchedSkills.slice(0, 3).map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25"
                      >
                        {sk}
                      </span>
                    ))}
                    {opp.matchedSkills.length > 3 && (
                      <span className="text-[10px] text-aurora-muted">
                        +{opp.matchedSkills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

OpportunityStreamFeed.displayName = 'OpportunityStreamFeed';
