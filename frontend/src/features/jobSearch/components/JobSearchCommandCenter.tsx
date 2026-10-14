import React from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  RefreshCw,
  Compass,
  Cpu,
  Target,
  ShieldCheck,
  Globe,
} from 'lucide-react';

export interface JobSearchCommandCenterProps {
  searchKeyword: string;
  onSearchKeywordChange: (val: string) => void;
  searchLocation: string;
  onSearchLocationChange: (val: string) => void;
  remoteOnly: boolean;
  onRemoteOnlyToggle: () => void;
  employmentType: string;
  onEmploymentTypeChange: (val: string) => void;
  sortBy: 'match' | 'date' | 'salary' | 'relevance';
  onSortByChange: (val: 'match' | 'date' | 'salary' | 'relevance') => void;
  targetRoleTitle: string;
  totalSkills: number;
  readinessScore: number;
  providerStatus: string;
  isSearching: boolean;
  onExecuteSearch: () => void;
}

export const JobSearchCommandCenter: React.FC<JobSearchCommandCenterProps> = ({
  searchKeyword,
  onSearchKeywordChange,
  searchLocation,
  onSearchLocationChange,
  remoteOnly,
  onRemoteOnlyToggle,
  employmentType,
  onEmploymentTypeChange,
  sortBy,
  onSortByChange,
  targetRoleTitle,
  totalSkills,
  readinessScore,
  providerStatus,
  isSearching,
  onExecuteSearch,
}) => {
  const employmentTypes = [
    { id: 'ALL', label: 'All Types' },
    { id: 'FULLTIME', label: 'Full-Time' },
    { id: 'CONTRACTOR', label: 'Contract' },
    { id: 'INTERN', label: 'Internship' },
  ];

  const sortOptions = [
    { id: 'match', label: 'Match Score' },
    { id: 'date', label: 'Latest Date' },
    { id: 'salary', label: 'Estimated Salary' },
    { id: 'relevance', label: 'Relevance' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_60%)] p-6 md:p-8 shadow-aurora-md space-y-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[130px]" />

      <div className="relative z-10 space-y-5">
        {/* Top Header & Context Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-aurora-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                <Briefcase className="w-3.5 h-3.5 text-aurora-indigo" />
                Job search
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Job Listings
              </span>

              <span className="text-xs text-aurora-muted flex items-center gap-1">
                Source: <strong className="text-aurora-ink">{providerStatus}</strong>
              </span>
            </div>
          </div>

          {/* Profile Context Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-aurora-indigo" />
              <span className="text-aurora-muted">Target:</span>
              <strong className="text-aurora-ink truncate max-w-[150px]">{targetRoleTitle}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-aurora-violet" />
              <span className="text-aurora-muted">Skills:</span>
              <strong className="text-aurora-ink">{totalSkills}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-aurora-violet" />
              <span className="text-aurora-muted">Readiness:</span>
              <strong className="text-aurora-ink">{readinessScore}%</strong>
            </div>
          </div>
        </div>

        {/* Search Input Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onExecuteSearch();
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* Keyword / Role Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-aurora-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              placeholder="Search by role title, technical skill, or company..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-sm text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-medium"
            />
          </div>

          {/* Location Input */}
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-aurora-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => onSearchLocationChange(e.target.value)}
              placeholder="Location or remote..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-sm text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-medium"
            />
          </div>

          {/* Search Trigger Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 px-5 rounded-2xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-sm font-bold text-aurora-ink shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Searching Roles...' : 'Search Opportunities'}</span>
            </button>
          </div>
        </form>

        {/* Filters Bar: Remote, Employment Type, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Left filters: Remote toggle + Employment type pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRemoteOnlyToggle}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                remoteOnly
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-aurora-canvas/60 text-aurora-muted border-aurora-line hover:text-aurora-ink'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Remote Only</span>
            </button>

            <div className="flex bg-aurora-canvas/60 p-1 rounded-xl border border-aurora-line">
              {employmentTypes.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => onEmploymentTypeChange(et.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    employmentType === et.id
                      ? 'text-aurora-ink [background:var(--aurora-gradient-action)] font-semibold shadow-aurora-sm'
                      : 'text-aurora-muted hover:text-aurora-ink'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right filters: Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-aurora-muted flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-aurora-muted" />
              Sort By:
            </span>
            <select
              aria-label="Sort By"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as JobSearchCommandCenterProps['sortBy'])}
              className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-aurora-canvas text-aurora-ink">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

JobSearchCommandCenter.displayName = 'JobSearchCommandCenter';
