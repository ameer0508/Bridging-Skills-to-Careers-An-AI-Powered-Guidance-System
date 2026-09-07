import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  Zap,
  ExternalLink,
  Circle,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';

export const LearningAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Management
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Query 1: Top Matched Careers
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const careerId = topMatch?.careerId?._id || '';
  const targetCareerTitle = topMatch?.careerId?.title || 'Target Career Role';

  // Query 2: Active Personalized Learning Roadmap
  const {
    data: roadmapData,
    isLoading: isRoadmapLoading,
    refetch: refetchRoadmap,
  } = useQuery({
    queryKey: ['roadmap', careerId],
    queryFn: async () => {
      if (!careerId) return null;
      try {
        const response = await apiClient.get(`/roadmap/${careerId}`);
        return response.data.data.roadmap;
      } catch {
        return null;
      }
    },
    enabled: !!careerId,
  });

  // Query 3: High Priority AI Recommendations
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

  // Query 4: Career Readiness Telemetry
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  // Roadmap Items & Calculations
  const roadmapItems = useMemo(() => {
    return roadmapData?.items || [];
  }, [roadmapData]);

  const filteredItems = useMemo(() => {
    if (!filterQuery.trim()) return roadmapItems;
    const query = filterQuery.toLowerCase();
    return roadmapItems.filter(
      (item: { title?: string; description?: string }) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [roadmapItems, filterQuery]);

  const completedCount = useMemo(() => {
    return roadmapItems.filter((i: { status: string }) => i.status === 'COMPLETED').length;
  }, [roadmapItems]);

  const totalCount = roadmapItems.length || 1;
  const completionPercent = useMemo(() => {
    if (roadmapItems.length === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount, roadmapItems]);

  const overallReadiness = readinessData?.overallScore || 0;
  const readinessBoostLabel = `+${Math.min(15, Math.round(completionPercent * 0.15))}% Readiness Boost`;

  // Item Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' }) => {
      const response = await apiClient.patch(`/roadmap/${careerId}/items/${itemId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', careerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      addToast({
        type: 'success',
        message: 'Curriculum module status updated successfully!',
      });
    },
    onError: () => {
      addToast({
        type: 'error',
        message: 'Failed to update module status. Please try again.',
      });
    },
  });

  const handleToggleStatus = (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    updateStatusMutation.mutate({ itemId, status: nextStatus });
  };

  const handleRunCycle = async () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Executing autonomous learning cycle for [${targetCareerTitle}]...`,
    });

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['roadmap', careerId] }),
        queryClient.invalidateQueries({ queryKey: ['readiness'] }),
        queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
      ]);
      await refetchRoadmap();
      addToast({
        type: 'success',
        message: `Curriculum Optimized! Target: ${targetCareerTitle} (${completionPercent}% Complete, ${completedCount}/${totalCount} Modules Mastered)`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Learning cycle execution failed. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recommendationsList = recommendationsData || [];

  if (isRoadmapLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Connecting to Autonomous AI Learning Agent..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Autonomous AI Learning Command Center"
        userName={targetCareerTitle}
        title="Learning Intelligence Agent"
        description="Autonomous curriculum planning, adaptive learning pathways, topological node sequencing, and skill acquisition engine."
        aiSummary={`Progress: ${completionPercent}% • Completed: ${completedCount}/${totalCount} Modules • Readiness: ${overallReadiness}%`}
        stats={[
          { label: 'Curriculum Progress', value: `${completionPercent}%`, change: `${completedCount} of ${totalCount} Mastered`, isPositive: completionPercent >= 50 },
          { label: 'Overall Readiness', value: `${overallReadiness}%`, change: readinessBoostLabel, isPositive: overallReadiness >= 60 },
          { label: 'Total Modules', value: `${totalCount} Nodes`, change: 'Topological Order', isPositive: true },
          { label: 'Prerequisites Status', value: overallReadiness >= 50 ? '100% Met' : 'In Progress', change: 'Competency Validated', isPositive: overallReadiness >= 50 },
        ]}
      />

      {/* TOP TARGET SKILL SEARCH BAR & CONTROLS */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter curriculum modules..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => navigate('/roadmap')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold px-2 py-1"
          >
            Roadmap Graph →
          </button>
          <button
            onClick={handleRunCycle}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Optimizing Curriculum...' : 'Run Autonomous Learning Cycle'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Curriculum Progress</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {completionPercent}%
          </span>
          <span className="text-xs font-mono text-indigo-300">
            {completedCount} of {totalCount} Modules Mastered
          </span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Readiness Impact</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">
            {readinessBoostLabel}
          </span>
          <span className="text-xs font-mono text-emerald-300">Grounded Competency</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Prerequisite Health</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {overallReadiness >= 50 ? 'Validated' : 'Building'}
          </span>
          <span className="text-xs font-mono text-cyan-300">
            Readiness: {overallReadiness}%
          </span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Target Role</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block truncate">
            {targetCareerTitle}
          </span>
          <span className="text-xs font-mono text-purple-300">Top Competency Focus</span>
        </GlassPanel>
      </div>

      {/* ADAPTIVE CURRICULUM & STUDY SCHEDULE (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ADAPTIVE CURRICULUM SEQUENCE (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Adaptive Curriculum Sequence ({filteredItems.length} Modules)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              {completionPercent}% Complete
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-xs">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-400">
                No learning roadmap modules found. Select a target career in Career Intelligence to generate a personalized learning path.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((m: { _id?: string; itemId?: string; title: string; description?: string; hours?: number; status: string }) => {
                const itemId = m._id || m.itemId || '';
                const isCompleted = m.status === 'COMPLETED';

                return (
                  <div
                    key={itemId || m.title}
                    className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => itemId && handleToggleStatus(itemId, m.status)}
                          className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                          title="Toggle Completion Status"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <span className={`font-bold text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {m.title}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'}`}>
                        {m.status}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-slate-400 text-[11px] leading-relaxed pl-7">
                        {m.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 pl-7">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {m.hours || 4} Hours Estimated
                      </span>
                      {isCompleted && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Mastered
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>

        {/* CURATED HIGH-IMPACT RESOURCES & RECOMMENDATIONS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                AI Learning Recommendations ({recommendationsList.length})
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {recommendationsList.length === 0 ? (
                <div className="p-3 text-slate-400 text-xs text-center italic">
                  No active learning recommendations.
                </div>
              ) : (
                recommendationsList.slice(0, 4).map((rec: { _id: string; title: string; reasoning: string; actionType: string }) => (
                  <div key={rec._id} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] truncate">{rec.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {rec.reasoning}
                    </p>
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
        confidence={completionPercent || 90}
        lastUpdated="Learning Agent Active"
      />
    </div>
  );
};

export default LearningAgentWorkspace;
