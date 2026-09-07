import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass,
  Trophy,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Award,
  Sparkles,
  DollarSign,
  Lightbulb,
  ExternalLink,
  Briefcase,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';

export interface OpportunityItem {
  externalId: string;
  provider: string;
  title: string;
  company: string;
  description: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salary?: { min?: number; max?: number; currency?: string; period?: string } | null;
  postedAt: string;
  applicationUrl: string;
  sourceUrl?: string;
  skills: string[];
  skillbridgeMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchExplanation?: string;
}

export interface SavedOpportunityItem {
  _id?: string;
  externalId: string;
  provider: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  applicationUrl: string;
  postedAt: string;
  savedAt: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  notes?: string;
  skillbridgeMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  description?: string;
}

export const OpportunityDiscoveryWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SAVED' | 'CAREER' | 'AI'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'SAVED') return 'SAVED';
    if (tabParam === 'CAREER') return 'CAREER';
    if (tabParam === 'AI') return 'AI';
    return 'LIVE';
  });
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [datePosted, setDatePosted] = useState<string>('all');
  const [employmentType, setEmploymentType] = useState<string>('ALL');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'salary' | 'relevance'>('match');
  const [minScore, setMinScore] = useState<number>(60);
  const [page, setPage] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | SavedOpportunityItem | null>(null);

  // Sync tab from URL if params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'SAVED') setActiveTab('SAVED');
    else if (tabParam === 'LIVE') setActiveTab('LIVE');
  }, [searchParams]);

  // Accessibility: Dismiss details drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOpportunity) {
        setSelectedOpportunity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOpportunity]);

  // Query 1: Live External Opportunities from Provider
  const {
    data: opportunitiesData,
    isLoading: isOpportunitiesLoading,
    refetch: refetchOpportunities,
  } = useQuery({
    queryKey: ['opportunities', searchKeyword, searchLocation, datePosted, employmentType, remoteOnly, sortBy, minScore, page],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/opportunities', {
          params: {
            search: searchKeyword || undefined,
            location: searchLocation || undefined,
            datePosted: datePosted !== 'all' ? datePosted : undefined,
            employmentType: employmentType !== 'ALL' ? employmentType : undefined,
            remote: remoteOnly ? 'true' : undefined,
            sortBy,
            minScore,
            page,
            limit: 10,
          },
        });
        return response.data.data || { opportunities: [], providerHealth: { status: 'PENDING_CREDS', provider: 'JSearch' } };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Provider request failed';
        return {
          opportunities: [],
          providerHealth: { status: 'DOWN', provider: 'JSearch API', message },
        };
      }
    },
  });

  // Query 2: Persisted Saved Opportunities
  const { data: savedData, refetch: refetchSaved } = useQuery({
    queryKey: ['opportunities', 'saved'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/opportunities/saved');
        return response.data.data.savedOpportunities || [];
      } catch {
        return [];
      }
    },
  });

  // Query 3: Application Pipeline Telemetry
  const { data: telemetryData, refetch: refetchTelemetry } = useQuery({
    queryKey: ['opportunities', 'telemetry'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/opportunities/telemetry');
        return response.data.data;
      } catch {
        return { savedCount: 0, appliedCount: 0, interviewingCount: 0, offerCount: 0, rejectedCount: 0, withdrawnCount: 0 };
      }
    },
  });

  // Query 4: Target Career Matches (MongoDB Career Taxonomy)
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 5: High Priority AI Recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/recommendations');
        return response.data.data.recommendations || [];
      } catch {
        return [];
      }
    },
  });

  // Query 6: Verified User Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Query 7: Career Readiness Telemetry
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  const liveOpportunities: OpportunityItem[] = opportunitiesData?.opportunities || [];
  const providerHealth = opportunitiesData?.providerHealth || { status: 'UP', provider: 'JSearch API' };
  const savedOpportunities: SavedOpportunityItem[] = savedData || [];
  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const targetRoleTitle = topMatch?.careerId?.title || 'Target Career Role';

  const savedExternalIds = useMemo(() => {
    return new Set(savedOpportunities.map((s) => s.externalId));
  }, [savedOpportunities]);

  // Telemetry Metrics
  const topMatchScore = liveOpportunities[0]?.skillbridgeMatchScore || topMatch?.matchScore || 90;
  const readinessScore = readinessData?.overallScore || 0;

  const userSkillNames = useMemo(() => {
    if (skillsData?.categories) {
      const all: string[] = [];
      Object.values(skillsData.categories).forEach((items) => {
        (items as Array<{ name: string }>).forEach((s) => all.push(s.name));
      });
      return all;
    }
    return [];
  }, [skillsData]);

  const eligibilityPercent = useMemo(() => {
    if (userSkillNames.length === 0) return 75;
    return Math.min(98, Math.max(60, Math.round((userSkillNames.length / (userSkillNames.length + 2)) * 100)));
  }, [userSkillNames]);

  const explainableReasoning = useMemo(() => {
    if (liveOpportunities.length > 0 && liveOpportunities[0]?.matchedSkills?.length > 0) {
      return `Target role pathway [${targetRoleTitle}] matched based on verified skills (${liveOpportunities[0].matchedSkills.join(', ')}) against live JSearch employer requirements.`;
    }
    return `Target role pathway [${targetRoleTitle}] aligned with candidate skill matrix. Execute live discovery to update real-time telemetry.`;
  }, [liveOpportunities, targetRoleTitle]);

  // Save / Bookmark Actions
  const handleToggleSave = async (opp: OpportunityItem | SavedOpportunityItem) => {
    const isSaved = savedExternalIds.has(opp.externalId);
    try {
      if (isSaved) {
        await apiClient.delete(`/opportunities/${opp.externalId}/save`);
        addToast({ type: 'info', message: `Removed [${opp.title}] from saved pipeline.` });
      } else {
        await apiClient.post('/opportunities/save', {
          externalId: opp.externalId,
          provider: opp.provider || 'JSearch API',
          title: opp.title,
          company: opp.company,
          location: opp.location,
          salary: typeof opp.salary === 'object' && opp.salary?.min && opp.salary?.max
            ? `$${(opp.salary.min / 1000).toFixed(0)}k - $${(opp.salary.max / 1000).toFixed(0)}k`
            : typeof opp.salary === 'string' ? opp.salary : 'Salary Not Disclosed',
          applicationUrl: opp.applicationUrl,
          postedAt: opp.postedAt,
          skillbridgeMatchScore: opp.skillbridgeMatchScore,
          matchedSkills: opp.matchedSkills,
          missingSkills: opp.missingSkills,
          description: opp.description,
        });
        addToast({ type: 'success', message: `Saved [${opp.title}] to opportunity pipeline!` });
      }
      await Promise.all([refetchSaved(), refetchTelemetry()]);
    } catch {
      addToast({ type: 'error', message: 'Failed to update saved opportunity state.' });
    }
  };

  // Status Change in Pipeline
  const handleUpdateStatus = async (externalId: string, newStatus: SavedOpportunityItem['status'], notes?: string) => {
    try {
      await apiClient.patch(`/opportunities/saved/${externalId}/status`, { status: newStatus, notes });
      addToast({ type: 'success', message: `Pipeline status updated to [${newStatus.toUpperCase()}].` });
      await Promise.all([refetchSaved(), refetchTelemetry()]);
    } catch {
      addToast({ type: 'error', message: 'Failed to update pipeline status.' });
    }
  };

  const handleRunDiscovery = async () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Executing live provider query for [${searchKeyword || targetRoleTitle}]...`,
    });

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] }),
        queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
      ]);
      await refetchOpportunities();
      addToast({
        type: 'success',
        message: `Live Discovery Complete! Fetched ${liveOpportunities.length} opportunities from ${providerHealth.provider}.`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Live opportunity search failed. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isOpportunitiesLoading && liveOpportunities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Executing Live External Opportunity Provider Search..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Autonomous AI Opportunity Discovery Command Center"
        userName={targetRoleTitle}
        title="Opportunity Discovery Agent"
        description="Multi-modal opportunity discovery across verified career roles, research grants, skill fellowships, and high-impact industry programs."
        aiSummary={`Top Match: ${topMatchScore}% • Eligibility: ${eligibilityPercent}% • Discovered: ${liveOpportunities.length} Live Opportunities`}
        stats={[
          { label: 'Top Match Score', value: `${topMatchScore} / 100`, change: targetRoleTitle, isPositive: topMatchScore >= 80 },
          { label: 'Skill Eligibility Rate', value: `${eligibilityPercent}%`, change: `${userSkillNames.length} Verified Skills`, isPositive: eligibilityPercent >= 60 },
          { label: 'Live Discovered', value: `${liveOpportunities.length} Jobs`, change: 'RapidAPI JSearch Feed', isPositive: true },
          { label: 'Pipeline Saved', value: `${savedOpportunities.length} Bookmarks`, change: 'Persisted Records', isPositive: true },
        ]}
      />

      {/* TOP PIPELINE TELEMETRY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassPanel className="p-4 space-y-1.5 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Live Discovered</span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {liveOpportunities.length} Jobs
          </span>
          <span className="text-[11px] font-mono text-indigo-300">Provider Source: JSearch</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-1.5 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Saved Pipeline</span>
            <Bookmark className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-cyan-400 font-mono block">
            {telemetryData?.savedCount || savedOpportunities.length} Saved
          </span>
          <span className="text-[11px] font-mono text-cyan-300">Persisted Records</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-1.5 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Applications Sent</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">
            {telemetryData?.appliedCount || 0} Applied
          </span>
          <span className="text-[11px] font-mono text-emerald-300">Active Applications</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-1.5 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Interview Stage</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-purple-400 font-mono block">
            {telemetryData?.interviewingCount || 0} Interviewing
          </span>
          <span className="text-[11px] font-mono text-purple-300">In Progress</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-1.5 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Offers Received</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-400 font-mono block">
            {telemetryData?.offerCount || 0} Offers
          </span>
          <span className="text-[11px] font-mono text-amber-300">Success Outcomes</span>
        </GlassPanel>
      </div>

      {/* SEARCH CONTROLS PANEL */}
      <GlassPanel className="p-5 space-y-4 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-400" />
            Live Search & Filter Controls
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleRunDiscovery}
              disabled={isAnalyzing}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Scanning...' : 'Run Autonomous Discovery'}</span>
            </button>
          </div>
        </div>

        {/* INPUT FILTERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {/* Keyword Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Role / Keyword (Default: ${targetRoleTitle})`}
              value={searchKeyword}
              onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Location Input */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="City, State, or Country"
              value={searchLocation}
              onChange={(e) => { setSearchLocation(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Employment Type */}
          <div>
            <select
              value={employmentType}
              onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="ALL">All Employment Types</option>
              <option value="FULLTIME">Full-time</option>
              <option value="CONTRACTOR">Contractor / Freelance</option>
              <option value="PARTTIME">Part-time</option>
              <option value="INTERN">Internship</option>
            </select>
          </div>

          {/* Date Posted */}
          <div>
            <select
              value={datePosted}
              onChange={(e) => { setDatePosted(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">Any Date Posted</option>
              <option value="today">Past 24 Hours</option>
              <option value="3days">Past 3 Days</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </div>

        {/* SECONDARY CONTROLS (SORT, MIN SCORE, REMOTE TOGGLE) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5 font-mono text-xs text-slate-300">
          <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
            {/* Remote Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => { setRemoteOnly(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Remote Jobs Only</span>
            </label>

            {/* Minimum Match Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Min Match:</span>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="font-bold text-indigo-400">{minScore}%</span>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'date' | 'salary' | 'relevance')}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="match">SkillBridge Match Score</option>
              <option value="date">Newest Posted</option>
              <option value="salary">Highest Salary</option>
              <option value="relevance">Provider Relevance</option>
            </select>
          </div>
        </div>
      </GlassPanel>

      {/* PROVIDER HEALTH & STATUS BANNER */}
      {providerHealth.status === 'DOWN' && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 font-mono text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>
              <strong>Provider Unavailable:</strong> {providerHealth.message || 'JSearch API query failed. Live results unavailable.'}
            </span>
          </div>
          <button
            onClick={() => refetchOpportunities()}
            className="px-3 py-1 rounded bg-red-800/40 hover:bg-red-800/60 text-white font-bold text-[11px]"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* CATEGORY & TAB SELECTION */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'LIVE'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            DISCOVER (LIVE OPPORTUNITIES) [{liveOpportunities.length}]
          </button>

          <button
            onClick={() => setActiveTab('SAVED')}
            className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'SAVED'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            SAVED PIPELINE [{savedOpportunities.length}]
          </button>

          <button
            onClick={() => setActiveTab('CAREER')}
            className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'CAREER'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            CAREER TAXONOMY [{matches.length}]
          </button>

          <button
            onClick={() => setActiveTab('AI')}
            className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'AI'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            AI PATHWAYS [{(recommendationsData || []).length}]
          </button>
        </div>

        <button
          onClick={() => navigate('/careers')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold"
        >
          Career Intelligence Taxonomy →
        </button>
      </div>

      {/* MAIN CONTENT AREA BY TAB */}
      {activeTab === 'LIVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LIVE OPPORTUNITY FEED (8 COLS) */}
          <GlassPanel className="lg:col-span-8 p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Live External Opportunities ({liveOpportunities.length})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                LIVE EXTERNAL DATA • SOURCE: JSEARCH
              </span>
            </div>

            {liveOpportunities.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-xs">
                <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-slate-300 font-bold">No Live External Opportunities Found</p>
                <p className="text-slate-500 max-w-md mx-auto">
                  Try broadening search keywords or location filters. Autonomous Discovery queries the live RapidAPI JSearch provider directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {liveOpportunities.map((opp) => {
                  const isSaved = savedExternalIds.has(opp.externalId);
                  const salaryStr = opp.salary?.min && opp.salary?.max
                    ? `$${(opp.salary.min / 1000).toFixed(0)}k - $${(opp.salary.max / 1000).toFixed(0)}k`
                    : 'Salary Not Disclosed';

                  return (
                    <div
                      key={opp.externalId}
                      className="p-5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 hover:border-indigo-500/40 transition-all shadow-md"
                    >
                      {/* HEADER ROW */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white text-base hover:text-indigo-300 transition-colors">
                              {opp.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              LIVE EXTERNAL • JSEARCH
                            </span>
                            {opp.remote && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                REMOTE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-xs flex-wrap">
                            <span className="flex items-center gap-1 text-indigo-300 font-bold">
                              <Building2 className="w-3.5 h-3.5" /> {opp.company}
                            </span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {opp.location}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <DollarSign className="w-3.5 h-3.5" /> {salaryStr}
                            </span>
                          </div>
                        </div>

                        {/* MATCH SCORE BADGE & SAVE BUTTON */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                            <Sparkles className="w-3.5 h-3.5" /> SkillBridge Match: {opp.skillbridgeMatchScore}%
                          </span>

                          <button
                            onClick={() => handleToggleSave(opp)}
                            title={isSaved ? 'Remove from Saved' : 'Save to Pipeline'}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isSaved
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* SKILL MATCH BREAKDOWN */}
                      <div className="space-y-1.5 pt-1">
                        {opp.matchedSkills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-slate-400 font-bold">MATCHED SKILLS:</span>
                            {opp.matchedSkills.map((sk) => (
                              <span key={sk} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                ✓ {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        {opp.missingSkills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-slate-400 font-bold">MISSING SKILLS:</span>
                            {opp.missingSkills.map((sk) => (
                              <span key={sk} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                                + {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CARD FOOTER ACTIONS */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 flex-wrap gap-2">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> Posted: {opp.postedAt ? new Date(opp.postedAt).toLocaleDateString() : 'Recent'} • Provider: <strong className="text-purple-300">{opp.provider}</strong>
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedOpportunity(opp)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                          >
                            Inspect Details
                          </button>

                          <a
                            href={opp.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <span>VIEW OPPORTUNITY</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* PAGINATION CONTROLS */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-slate-400">
                    Page <strong className="text-white">{page}</strong> • {liveOpportunities.length} Results
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={liveOpportunities.length < 10}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* RIGHT TELEMETRY & REASONING PANEL (4 COLS) */}
          <div className="lg:col-span-4 space-y-6 font-mono text-xs">
            <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  Explainable Match Telemetry
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {explainableReasoning}
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 space-y-4 border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Live Provider Health
                </span>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span>Provider Name:</span>
                  <strong className="text-indigo-300">{providerHealth.provider}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    providerHealth.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {providerHealth.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span>Verified User Skills:</span>
                  <strong className="text-cyan-400">{userSkillNames.length} Skills</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span>Readiness Benchmark:</span>
                  <strong className="text-emerald-400">{readinessScore}%</strong>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* SAVED PIPELINE TAB */}
      {activeTab === 'SAVED' && (
        <GlassPanel className="p-6 space-y-6 border-amber-500/30 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              Persisted Opportunity Application Pipeline ({savedOpportunities.length})
            </span>
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-950/60 rounded-xl border border-white/5">
              <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-slate-300 font-bold">No Saved Opportunities Yet</p>
              <p className="text-slate-500">
                Click the bookmark icon on any live opportunity card to save it to your pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedOpportunities.map((item) => (
                <div
                  key={item.externalId}
                  className="p-5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-indigo-300 text-xs font-bold">{item.company} • {item.location}</p>
                    </div>

                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.externalId, e.target.value as SavedOpportunityItem['status'])}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/20 text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
                    >
                      <option value="saved">SAVED</option>
                      <option value="applied">APPLIED</option>
                      <option value="interviewing">INTERVIEWING</option>
                      <option value="offer">OFFER</option>
                      <option value="rejected">REJECTED</option>
                      <option value="withdrawn">WITHDRAWN</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    <span>Saved: {new Date(item.savedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleSave(item as unknown as OpportunityItem)}
                        className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => navigate('/interviews')}
                        className="py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        Prepare Interview →
                      </button>
                      <a
                        href={item.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {/* CAREER TAXONOMY TAB */}
      {activeTab === 'CAREER' && (
        <GlassPanel className="p-6 space-y-4 border-purple-500/30 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              SkillBridge Career Matches (MongoDB Career Taxonomy)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              CAREER MATCH ROLE • SOURCE: SKILLBRIDGE CAREER ENGINE
            </span>
          </div>

          <div className="space-y-3">
            {matches.map((m: { _id?: string; careerId?: { _id?: string; title: string; industry?: string; salaryRange?: { min?: number; max?: number } }; matchScore?: number }, idx: number) => {
              const title = m.careerId?.title || 'Engineering Role';
              const industry = m.careerId?.industry || 'Technology';
              const score = m.matchScore || 90;

              return (
                <div key={m._id || idx} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{title}</h4>
                    <p className="text-slate-400">{industry} Industry Pathway • Global Taxonomy</p>
                  </div>
                  <span className="text-purple-400 font-bold text-xs bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/30">
                    SkillBridge Match: {score}%
                  </span>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* AI RECOMMENDATION PATHWAY TAB */}
      {activeTab === 'AI' && (
        <GlassPanel className="p-6 space-y-4 border-emerald-500/30 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              High Priority AI Guidance Pathways
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              AI RECOMMENDATION PATHWAY • SOURCE: SKILLBRIDGE RECOMMENDATION ENGINE
            </span>
          </div>

          <div className="space-y-3">
            {(recommendationsData || []).map((rec: { _id: string; title: string; reasoning: string; actionType: string }, idx: number) => (
              <div key={rec._id || idx} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{rec.title}</h4>
                  <span className="text-emerald-400 font-bold text-xs">Recommended Action</span>
                </div>
                <p className="text-slate-300 text-xs">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* OPPORTUNITY DETAILS DRAWER / MODAL */}
      {selectedOpportunity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="opportunity-drawer-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <GlassPanel className="max-w-2xl w-full p-6 space-y-6 border-indigo-500/50 relative max-h-[90vh] overflow-y-auto font-mono text-xs shadow-2xl shadow-indigo-950/50">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedOpportunity(null)}
              aria-label="Close opportunity details modal"
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HEADER */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  LIVE EXTERNAL DATA • JSEARCH
                </span>
                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  Match Score: {selectedOpportunity.skillbridgeMatchScore}%
                </span>
              </div>
              <h2 id="opportunity-drawer-title" className="text-xl font-bold text-white">
                {selectedOpportunity.title}
              </h2>
              <p className="text-indigo-300 text-sm font-bold">
                {selectedOpportunity.company} • {selectedOpportunity.location}
              </p>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/80 border border-white/10">
              <div>
                <span className="text-slate-500 block text-[10px]">EMPLOYMENT TYPE</span>
                <strong className="text-white">{selectedOpportunity.employmentType || 'FULL_TIME'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">LOCATION</span>
                <strong className="text-slate-300">{selectedOpportunity.location}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">POSTED DATE</span>
                <strong className="text-indigo-300">
                  {selectedOpportunity.postedAt ? new Date(selectedOpportunity.postedAt).toLocaleDateString() : 'Recent'}
                </strong>
              </div>
            </div>

            {/* SKILLS MATCH BREAKDOWN */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-white/10">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Grounded Competency Match
              </span>

              {selectedOpportunity.matchedSkills.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold block">VERIFIED MATCHED SKILLS:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedOpportunity.matchedSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedOpportunity.missingSkills.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-slate-400 text-[10px] font-bold block">RECOMMENDED SKILL GAPS:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedOpportunity.missingSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                        + {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SANITIZED DESCRIPTION */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300">Sanitized Opportunity Description</span>
              <div className="p-4 rounded-xl bg-slate-950/90 border border-white/10 text-slate-300 leading-relaxed text-xs max-h-48 overflow-y-auto whitespace-pre-line">
                {selectedOpportunity.description || 'No description provided by external employer.'}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleToggleSave(selectedOpportunity);
                  setSelectedOpportunity(null);
                }}
                className="py-2 px-4 rounded-xl bg-slate-900 border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-slate-800 cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                {savedExternalIds.has(selectedOpportunity.externalId) ? 'Remove Bookmark' : 'Save Opportunity'}
              </button>

              <a
                href={selectedOpportunity.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <span>VIEW OPPORTUNITY</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status={isAnalyzing ? 'thinking' : 'active'}
        confidence={topMatchScore || 90}
        lastUpdated="Opportunity Agent Active"
      />
    </div>
  );
};

export default OpportunityDiscoveryWorkspace;
