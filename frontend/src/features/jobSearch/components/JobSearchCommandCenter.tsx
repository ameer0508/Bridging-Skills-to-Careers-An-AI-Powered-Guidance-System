import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Compass,
  Cpu,
  Target,
  ShieldCheck,
  CheckCircle2,
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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative z-10 space-y-5">
        {/* Top Header & Context Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Opportunity Intelligence Workspace
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Employer Stream
              </span>

              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                Provider: <strong className="text-slate-200">JSearch Index</strong> ({providerStatus})
              </span>
            </div>
          </div>

          {/* Profile Context Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Target:</span>
              <strong className="text-white truncate max-w-[150px]">{targetRoleTitle}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Skills:</span>
              <strong className="text-white font-mono">{totalSkills}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">Readiness:</span>
              <strong className="text-white font-mono">{readinessScore}%</strong>
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
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              placeholder="Search by role title, technical skill, or company..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-medium"
            />
          </div>

          {/* Location Input */}
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => onSearchLocationChange(e.target.value)}
              placeholder="Location or remote..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-medium"
            />
          </div>

          {/* Search Trigger Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
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
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Remote Only</span>
            </button>

            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10">
              {employmentTypes.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => onEmploymentTypeChange(et.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    employmentType === et.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right filters: Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
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
