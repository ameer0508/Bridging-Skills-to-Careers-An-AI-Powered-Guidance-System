import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Globe,
  Sparkles,
  Award,
  Layers,
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
  postedAt: string | Date;
  applicationUrl: string;
  skills: string[];
  skillbridgeMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchExplanation?: string;
  status?: string;
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

  const formatPostedDate = (raw?: string | Date) => {
    if (!raw) return 'Recently';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'Recently';
    const diffHours = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${Math.max(1, diffHours)}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return { label: 'Applied', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'interviewing':
        return { label: 'Interviewing', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'offer':
        return { label: 'Offer Received', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'rejected':
        return { label: 'Archived', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      default:
        return { label: 'Saved', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl backdrop-blur-xl flex flex-col h-[740px]">
      {/* Header Tabs: Live vs Saved */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => onTabChange('LIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LIVE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Live Stream</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {liveOpportunities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('SAVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SAVED'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tracked Pipeline</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {savedOpportunities.length}
            </span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          {currentList.length} {currentList.length === 1 ? 'Role' : 'Roles'}
        </span>
      </div>

      {/* Opportunity Stream List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Querying Opportunity Stream...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-white/5 space-y-2 mt-12">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {activeTab === 'LIVE' ? 'No live opportunities found' : 'No tracked jobs yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
                    ? 'border-indigo-500/60 bg-gradient-to-r from-indigo-950/60 to-slate-900/90 shadow-lg shadow-indigo-500/10'
                    : 'border-white/5 bg-slate-950/60 hover:border-white/20 hover:bg-slate-950/90'
                }`}
              >
                {/* Active indicator border bar */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                )}

                {/* Top Row: Title + Save Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-indigo-300 transition">
                      {opp.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200 truncate flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {opp.company}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Match Score Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                      {opp.skillbridgeMatchScore}%
                    </span>

                    {/* Bookmark Save Action */}
                    <button
                      type="button"
                      onClick={(e) => onToggleSave(opp, e)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
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
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {opp.location || 'Remote'}
                  </span>

                  {opp.remote && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Remote
                    </span>
                  )}

                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatPostedDate(opp.postedAt)}
                  </span>

                  {statusBadge && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Matched Skills Chips */}
                {opp.matchedSkills && opp.matchedSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-slate-500">Matched:</span>
                    {opp.matchedSkills.slice(0, 3).map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      >
                        {sk}
                      </span>
                    ))}
                    {opp.matchedSkills.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500">
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
