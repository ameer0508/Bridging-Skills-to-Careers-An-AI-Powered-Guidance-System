import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Building,
  CheckCircle2,
  Search,
  RefreshCw,
  Target,
  Lightbulb,
  Award,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';

export const JobSearchAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Management
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Query 1: Top Career Matches & Reasoning
  const {
    data: matchesData,
    isLoading: isMatchesLoading,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 2: Career Readiness & Callback Telemetry
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  // Query 3: Active Resume ATS Index
  const { data: resumeData } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/resumes/me');
        return response.data.data.resume;
      } catch {
        return null;
      }
    },
  });

  // Query 4: Analytics Audit Trail & Events
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics?period=monthly');
      return response.data.data;
    },
  });

  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const targetRoleTitle = topMatch?.careerId?.title || 'Target Role';
  const topMatchScore = topMatch ? topMatch.matchScore : 0;

  // Filter matches by search query
  const filteredMatches = useMemo(() => {
    if (!searchFilter.trim()) return matches;
    const query = searchFilter.toLowerCase();
    return matches.filter(
      (m: { careerId?: { title?: string; description?: string } }) =>
        m.careerId?.title?.toLowerCase().includes(query) ||
        m.careerId?.description?.toLowerCase().includes(query)
    );
  }, [matches, searchFilter]);

  // Derived Telemetry Numbers
  const overallReadiness = readinessData?.overallScore || 0;
  const atsScore = resumeData?.atsScore || 0;
  const interviewProbability = useMemo(() => {
    if (!topMatch) return 0;
    return Math.min(99, Math.round(overallReadiness * 0.6 + (atsScore > 0 ? atsScore : 70) * 0.4));
  }, [topMatch, overallReadiness, atsScore]);

  const salaryTargetLabel = useMemo(() => {
    if (topMatch?.careerId?.salaryRange) {
      const { min, max } = topMatch.careerId.salaryRange;
      return `$${min.toLocaleString()} - $${max.toLocaleString()} USD`;
    }
    return 'Market Benchmark Pending';
  }, [topMatch]);

  const matchRationaleText = useMemo(() => {
    if (!topMatch) {
      return 'Upload a resume or select a target career in Career Intelligence to calculate explainable AI match reasoning.';
    }
    if (topMatch.reasoning?.rationale) {
      return topMatch.reasoning.rationale;
    }
    if (topMatch.reasoning?.strengths?.length > 0) {
      return `Matched based on key verified strengths: ${topMatch.reasoning.strengths.join(', ')}.`;
    }
    return `Candidate matches ${topMatch.matchScore}% of target competency requirements for ${targetRoleTitle}.`;
  }, [topMatch, targetRoleTitle]);

  const recentEvents = analyticsData?.recentEvents || [];

  const handleRunCycle = async () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Executing autonomous job search cycle for candidate target roles...`,
    });

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] }),
        queryClient.invalidateQueries({ queryKey: ['readiness'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      ]);
      await refetchMatches();
      addToast({
        type: 'success',
        message: topMatch
          ? `Cycle Complete! Top Match: ${topMatch.careerId?.title || 'Target Role'} (${topMatch.matchScore}% Fit, ${interviewProbability}% Interview Probability)`
          : 'Cycle Complete! Update your profile or resume to generate new career matches.',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to complete job search cycle. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isMatchesLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Connecting to Autonomous AI Job Search Agent..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Autonomous AI Job Search Command Center"
        userName={targetRoleTitle}
        title="Job Search Intelligence Agent"
        description="Autonomous opportunity discovery, candidate recruiter matching, salary target estimation, and application pipeline tracking."
        aiSummary={`Top Match: ${topMatchScore}% • Target Role: ${targetRoleTitle} • Callback Prob: ${interviewProbability}%`}
        stats={[
          { label: 'Top Match Score', value: topMatch ? `${topMatchScore}%` : 'N/A', change: topMatch ? 'Verified Fit' : 'Not Evaluated', isPositive: topMatchScore >= 70 },
          { label: 'Interview Callback Prob', value: `${interviewProbability}%`, change: interviewProbability >= 70 ? 'High Probability' : 'In Progress', isPositive: interviewProbability >= 70 },
          { label: 'Salary Target', value: salaryTargetLabel, change: 'Tier 1 Benchmark', isPositive: true },
          { label: 'Active Pipeline', value: `${matches.length} Roles`, change: 'Market Evaluated', isPositive: matches.length > 0 },
        ]}
      />

      {/* TOP USER ID SEARCH BAR & CONTROLS */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter target roles or skills..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleRunCycle}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Searching Opportunities...' : 'Run Autonomous Job Cycle'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Top Match Score</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {topMatch ? `${topMatchScore} / 100` : '0 / 100'}
          </span>
          <span className="text-xs font-mono text-indigo-300">
            {interviewProbability}% Interview Prob
          </span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Salary Counter Target</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block truncate">
            {salaryTargetLabel}
          </span>
          <span className="text-xs font-mono text-emerald-300">75th Percentile Tier</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Technical Readiness</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {overallReadiness}% Score
          </span>
          <span className="text-xs font-mono text-cyan-300">
            ATS Index: {atsScore > 0 ? `${atsScore}/100` : 'No Resume'}
          </span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Target Role</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block truncate">
            {targetRoleTitle}
          </span>
          <span className="text-xs font-mono text-purple-300">
            {topMatch?.careerId?.demandLevel ? `${topMatch.careerId.demandLevel} Demand` : 'High Market Fit'}
          </span>
        </GlassPanel>
      </div>

      {/* OPPORTUNITY FEED & AI REASONING (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OPPORTUNITY FEED (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Discovered Target Career Opportunities ({filteredMatches.length})
            </span>
            <button
              onClick={() => navigate('/careers')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold"
            >
              View All Matches →
            </button>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-white/5">
              <Building className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                No career opportunities found matching your criteria. Add skills or upload a resume to compute matches.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.slice(0, 5).map((match: { _id: string; matchScore: number; careerId?: { _id: string; title?: string; salaryRange?: { min: number; max: number }; demandLevel?: string; description?: string } }) => (
                <div
                  key={match._id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {match.careerId?.title || 'Target Role'}
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {match.matchScore}% Match
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] line-clamp-2">
                    {match.careerId?.description || 'Strategic role aligned with candidate competencies.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                    <span className="text-indigo-300">
                      Demand: {match.careerId?.demandLevel || 'High'}
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {match.careerId?.salaryRange
                        ? `$${match.careerId.salaryRange.min.toLocaleString()} - $${match.careerId.salaryRange.max.toLocaleString()}`
                        : 'Competitive Salary'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* AI REASONING & COMPANY INSIGHTS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Explainable AI Match Rationale
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono">
              <span className="text-purple-300 font-bold block">Why {targetRoleTitle}?</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {matchRationaleText}
              </p>
            </div>
          </GlassPanel>

          {/* APPLICATION AUDIT FEED */}
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Recent System Telemetry Events
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {recentEvents.length === 0 ? (
                <div className="p-3 text-slate-400 text-xs text-center italic">
                  No recent job search events recorded.
                </div>
              ) : (
                recentEvents.slice(0, 4).map((evt: { _id: string; eventType: string; createdAt: string | number | Date }) => (
                  <div key={evt._id} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-bold text-white">{evt.eventType.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status={isAnalyzing ? 'thinking' : 'active'}
        confidence={98.2}
        lastUpdated="Job Search Agent Active"
      />
    </div>
  );
};

export default JobSearchAgentWorkspace;
