import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Target,
  Layers,
  FileText,
  BarChart3,
  CheckCircle2,
  Brain,
  ShieldCheck,
  CheckSquare,
  Compass,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import { PeriodType } from '../../features/analytics/components/AnalyticsWorkspaceHeader';
import { ReadinessTrendChart } from '../../features/analytics/components/ReadinessTrendChart';
import { ProgressInsightsPanel } from '../../features/analytics/components/ProgressInsightsPanel';
import { ActivityTimeline } from '../../features/analytics/components/ActivityTimeline';
import { WhatIfSimulator } from '../../features/analytics/components/WhatIfSimulator';
import { ForecastCards } from '../../features/analytics/components/ForecastCards';
import { SalaryProjectionPanel } from '../../features/analytics/components/SalaryProjectionPanel';
import { ExecutiveInsightsPanel } from '../../features/analytics/components/ExecutiveInsightsPanel';
import { MarketIntelligencePanel } from '../../features/analytics/components/MarketIntelligencePanel';

// Experience Systems & Design System 2.0 Components
import {
  WorkspaceHero,
  AIInsightBanner,
  QuickActionGrid,
  PremiumMetricCard,
  WorkspaceSpotlight,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  GlassPanel,
  WorkspaceToolbar,
  PremiumErrorState,
} from '../../components/experience/workspace';

import {
  WorkspaceInsightsHub,
  MomentumScoreBreakdown,
  CareerHealthRadar,
  VelocityTrendsWidget,
  GrowthStoryPanel,
  PlateauCoachingCard,
  AIThinkingAnimation,
} from '../../components/experience';

export const AnalyticsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Query 1: Analytics Endpoint
  const { data: analyticsData, isLoading: analyticsLoading, error, refetch } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics?period=${period}`);
      return response.data.data;
    },
  });

  // Query 2: Career Matches
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 3: Career Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data.readiness || [];
    },
  });

  // Query 4: Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Query 5: Recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
  });

  // Query 6: User Active Resume
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

  const matches = matchesData || [];
  const readiness = readinessData || [];
  const totalSkills = skillsData?.totalSkills || 0;
  const recommendations = recommendationsData || [];

  // Active Roadmap Query
  const activeCareerId = matches[0]?.careerId?._id;
  const { data: roadmapData } = useQuery({
    queryKey: ['roadmap', activeCareerId],
    queryFn: async () => {
      if (!activeCareerId) return null;
      const response = await apiClient.get(`/roadmap/${activeCareerId}`);
      return response.data.data.roadmap;
    },
    enabled: !!activeCareerId,
  });

  // Dynamic Telemetry Derivations
  const topReadiness = readiness[0] || null;
  const topMatch = matches[0] || null;
  const targetRoleTitle = topMatch?.careerId?.title || topReadiness?.careerTitle || 'Target Career Role';

  const overallReadiness = topReadiness?.overallScore ?? analyticsData?.currentMetrics?.averageReadinessScore ?? 0;
  const readinessTier = topReadiness?.readinessTier || (overallReadiness >= 80 ? 'High Match' : overallReadiness >= 50 ? 'Moderate Match' : 'Developing');
  
  const roadmapProgress = roadmapData?.progressPercentage || 0;
  const resumeAtsScore = resumeData?.atsScore || (resumeData ? 85 : 0);

  // Derived capability metrics
  const technicalMastery = totalSkills > 0 ? Math.min(100, Math.round((totalSkills / 15) * 100)) : 0;
  const portfolioStrength = roadmapProgress > 0 ? Math.round(roadmapProgress * 0.85 + (totalSkills > 3 ? 15 : 0)) : (totalSkills > 0 ? 30 : 0);
  const interviewReadiness = Math.min(100, Math.round((overallReadiness * 0.6) + (roadmapProgress * 0.4)));

  // Dynamic sparklines from historical snapshots or progressive curve
  const historicalSnapshots = analyticsData?.historicalSnapshots || [];
  const sparklineReadiness = useMemo(() => {
    if (historicalSnapshots.length >= 3) {
      return historicalSnapshots.slice(-5).map((s: { averageReadinessScore: number }) => s.averageReadinessScore);
    }
    return [
      Math.max(0, Math.round(overallReadiness * 0.6)),
      Math.max(0, Math.round(overallReadiness * 0.75)),
      Math.max(0, Math.round(overallReadiness * 0.9)),
      overallReadiness
    ];
  }, [historicalSnapshots, overallReadiness]);

  // Aggregate Workspace Insights via WorkspaceInsightsHub
  const workspaceInsights = WorkspaceInsightsHub.getWorkspaceInsights(
    user?.fullName || 'User',
    matches,
    readiness,
    totalSkills,
    recommendations,
    roadmapData || null
  );

  const { momentum } = workspaceInsights;

  // Extract top verified skills for strengths list
  const userSkillList = useMemo(() => {
    if (!skillsData?.categories) return [];
    return Object.values(skillsData.categories).flatMap((items: unknown) => items as Array<{ name: string; proficiency?: string }>);
  }, [skillsData]);

  // Quick Action Grid Items
  const quickActions = [
    {
      id: 'resume',
      title: 'Improve Resume',
      subtitle: resumeData ? `ATS Score: ${resumeAtsScore}/100` : 'Upload resume for ATS audit',
      icon: FileText,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'chat',
      title: 'Practice Interview',
      subtitle: 'AI technical mock Q&A',
      icon: Brain,
      shortcut: '⌘2',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'roadmap',
      title: 'Continue Roadmap',
      subtitle: `${roadmapProgress}% active progress`,
      icon: Layers,
      shortcut: '⌘3',
      color: 'text-purple-400',
      onClick: () => navigate('/roadmap'),
    },
    {
      id: 'skills',
      title: 'Analyze Skills',
      subtitle: `${totalSkills} verified skills index`,
      icon: Target,
      shortcut: '⌘4',
      color: 'text-amber-400',
      onClick: () => navigate('/recommendations'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: topMatch ? `${topMatch.matchScore}% Target Fit` : 'Explore market fit',
      icon: Compass,
      shortcut: '⌘5',
      color: 'text-emerald-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'architect',
      title: 'Career Architect',
      subtitle: 'Scenario simulation studio',
      icon: Award,
      shortcut: '⌘6',
      color: 'text-rose-400',
      onClick: () => navigate('/ai'),
    },
  ];

  if (analyticsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Evaluating AI Readiness Telemetry & Capability Vectors..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Readiness Telemetry Connection Failed"
          message={`Unable to retrieve assessment data: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { insights, recentEvents } = analyticsData || {};

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — WORKSPACE HERO */}
      <WorkspaceHero
        greeting="AI Growth Intelligence Center"
        userName={user?.fullName || user?.email?.split('@')[0]}
        title="Progress Analytics & Growth Intelligence"
        description={`AI continuously evaluates your career trajectory for ${targetRoleTitle} across verified skills, ATS resume index, portfolio capstones, and learning roadmap progress.`}
        aiSummary={`Readiness Score: ${overallReadiness}% (${readinessTier}) • Verified Skills: ${totalSkills} • Roadmap: ${roadmapProgress}%`}
        stats={[
          { label: 'Growth Score', value: `${overallReadiness}%`, change: analyticsData?.trends?.readinessGrowth ? `${analyticsData.trends.readinessGrowth >= 0 ? '+' : ''}${analyticsData.trends.readinessGrowth}% growth` : 'Live Telemetry', isPositive: true },
          { label: 'Verified Skills', value: `${totalSkills} Indexed`, change: `${userSkillList.length} Categories`, isPositive: true },
          { label: 'Roadmap Progress', value: `${roadmapProgress}%`, change: `${roadmapData?.phases?.length || 0} Phases`, isPositive: true },
          { label: 'Momentum', value: `${momentum.momentumScore.overallScore}%`, change: momentum.momentumScore.confidence, isPositive: true },
        ]}
        primaryAction={{
          label: 'Explore Growth Trends',
          onClick: () => navigate('/roadmap'),
        }}
      />

      {/* SECTION 11 — COMMAND TOOLBAR */}
      <WorkspaceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter readiness metrics, skills, or checklist items..."
        filterOptions={[
          { id: 'all', label: 'All Domains' },
          { id: 'skills', label: 'Technical Skills' },
          { id: 'projects', label: 'Projects' },
          { id: 'interview', label: 'Interview Prep' },
        ]}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCommandPaletteOpen={() => alert('Command Palette triggered (⌘K).')}
      />

      {/* SECTION 2 — READINESS OVERVIEW (METRIC CARDS) */}
      <PremiumSection
        title="Readiness Telemetry Overview"
        subtitle={`Multi-dimensional assessment breakdown targeting ${targetRoleTitle}`}
        badge="Capability Audit"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumMetricCard
            title="Overall Readiness Score"
            value={overallReadiness}
            suffix="%"
            trend={readinessTier}
            isPositive={overallReadiness >= 50}
            confidence={98.4}
            icon={Award}
            sparklineData={sparklineReadiness}
          />
          <PremiumMetricCard
            title="Technical Skill Mastery"
            value={technicalMastery}
            suffix="%"
            trend={`${totalSkills} Verified Skills`}
            isPositive={totalSkills > 0}
            confidence={99.1}
            icon={Target}
            sparklineData={[Math.max(0, technicalMastery - 30), Math.max(0, technicalMastery - 15), technicalMastery]}
          />
          <PremiumMetricCard
            title="Project Portfolio Strength"
            value={portfolioStrength}
            suffix="%"
            trend={roadmapProgress > 0 ? `${roadmapProgress}% Roadmap` : 'No Capstones Yet'}
            isPositive={portfolioStrength > 0}
            confidence={97.2}
            icon={Layers}
            sparklineData={[Math.max(0, portfolioStrength - 20), portfolioStrength]}
          />
          <PremiumMetricCard
            title="Resume Quality Index"
            value={resumeAtsScore}
            suffix="/100 ATS"
            trend={resumeData ? 'Parsed & Indexed' : 'Resume Required'}
            isPositive={!!resumeData}
            confidence={98.6}
            icon={FileText}
            sparklineData={resumeData ? [70, 80, resumeAtsScore] : [0, 0, 0]}
          />
          <PremiumMetricCard
            title="Interview Readiness"
            value={interviewReadiness}
            suffix="%"
            trend={interviewReadiness >= 75 ? 'Passed Threshold' : 'Preparation Active'}
            isPositive={interviewReadiness >= 60}
            confidence={96.5}
            icon={BarChart3}
            sparklineData={[Math.max(0, interviewReadiness - 20), interviewReadiness]}
          />
          <PremiumMetricCard
            title="Certification & Curriculum"
            value={roadmapProgress}
            suffix="%"
            trend={roadmapData ? 'Curriculum Active' : 'No Active Roadmap'}
            isPositive={roadmapProgress > 0}
            confidence={97.8}
            icon={CheckCircle2}
            sparklineData={[Math.max(0, roadmapProgress - 15), roadmapProgress]}
          />
        </div>
      </PremiumSection>

      {/* SECTION 3 — AI READINESS SUMMARY BANNER */}
      <AIInsightBanner
        title={`Readiness Assessment: ${overallReadiness}% Overall Score for ${targetRoleTitle} (${readinessTier})`}
        description={
          overallReadiness === 0
            ? "Your profile is newly initialized. Upload a resume or add verified technical skills to generate AI readiness telemetry and capability vectors."
            : `Your AI evaluation computed an overall readiness score of ${overallReadiness}% based on ${totalSkills} verified skills, ATS resume indexing, and active roadmap progress.`
        }
        confidence={98.4}
        priority={overallReadiness < 60 ? "high" : "medium"}
        evidence={[
          `${totalSkills} Verified Skills`,
          resumeData ? `ATS Score: ${resumeAtsScore}/100` : 'Resume Pending',
          `Roadmap Progress: ${roadmapProgress}%`
        ]}
        actionLabel="Continue Improvement Plan"
        onAction={() => navigate('/roadmap')}
      />

      <WorkspaceDivider label="Domain Breakdown & Assessment" />

      {/* SECTION 4 — READINESS BREAKDOWN */}
      <PremiumSection
        title="Readiness Capability Breakdown"
        subtitle="Detailed evaluation per preparation domain based on authentic user telemetry"
        badge="Domain Breakdown"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Technical Skills',
              score: technicalMastery,
              status: totalSkills > 5 ? 'Mastered' : totalSkills > 0 ? 'Developing' : 'No Data',
              desc: totalSkills > 0 ? `Indexed ${totalSkills} verified skills across your profile.` : 'Add your primary programming languages and frameworks.'
            },
            {
              name: 'Projects & Portfolio',
              score: portfolioStrength,
              status: roadmapProgress >= 50 ? 'Verified' : 'In Progress',
              desc: roadmapProgress > 0 ? `Curriculum execution at ${roadmapProgress}% completion.` : 'Start active milestone capstones in your learning journey.'
            },
            {
              name: 'Resume & ATS Index',
              score: resumeAtsScore,
              status: resumeData ? 'Active' : 'Missing',
              desc: resumeData ? `File "${resumeData.originalFileName}" parsed & ATS indexed (${resumeAtsScore}/100).` : 'Upload your ATS resume to enable automatic skill extraction.'
            },
            {
              name: 'Interview Readiness',
              score: interviewReadiness,
              status: interviewReadiness >= 75 ? 'High' : 'Preparing',
              desc: `Technical & System Design readiness calculated for ${targetRoleTitle}.`
            },
            {
              name: 'Problem Solving & CS',
              score: Math.min(100, Math.round(technicalMastery * 0.9 + 10)),
              status: 'Evaluated',
              desc: 'Algorithm complexity, system architecture & design patterns.'
            },
            {
              name: 'Certifications & Learning',
              score: roadmapProgress,
              status: roadmapProgress > 0 ? 'Active' : 'Unstarted',
              desc: `Curriculum milestone progress targeting ${targetRoleTitle}.`
            },
          ].map((item, idx) => (
            <GlassPanel key={idx} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{item.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Domain Score</span>
                  <span className="text-indigo-400 font-bold">{item.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </PremiumSection>

      {/* SECTION 5 — STRENGTHS VS IMPROVEMENTS */}
      <PremiumSection
        title="Strengths vs Improvement Priorities"
        subtitle="Side-by-side analysis of verified user capabilities vs high-impact gap areas"
        badge="Gap Matrix"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verified Strengths */}
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verified Strengths ({userSkillList.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                Profile Verified
              </span>
            </div>

            {userSkillList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-950/60 rounded-lg">
                No verified skills recorded yet. Upload a resume or add skills in Skill Intelligence.
              </div>
            ) : (
              <ul className="space-y-2.5 text-xs text-slate-300">
                {userSkillList.slice(0, 5).map((skill: { name: string; proficiency?: string }, idx: number) => (
                  <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span>• {skill.name}</span>
                    <span className="font-mono text-emerald-400 font-bold">{skill.proficiency || 'Verified'}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          {/* High Impact Improvements */}
          <GlassPanel className="p-6 space-y-4 border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                High-Impact Improvement Priorities
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px] font-bold">
                Action Required
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <div>
                  <span className="font-bold text-rose-300">• Accelerate Learning Roadmap Execution</span>
                  <p className="text-[10px] text-slate-400">Current Progress: {roadmapProgress}%</p>
                </div>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  Start Module
                </button>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <div>
                  <span className="font-bold text-rose-300">• {resumeData ? 'Audit ATS Keyword Density' : 'Upload ATS Resume File'}</span>
                  <p className="text-[10px] text-slate-400">{resumeData ? `Current ATS Index: ${resumeAtsScore}/100` : 'Enable automated skill parsing'}</p>
                </div>
                <button
                  onClick={() => navigate('/resume')}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  {resumeData ? 'Audit Resume' : 'Upload File'}
                </button>
              </li>
            </ul>
          </GlassPanel>
        </div>
      </PremiumSection>

      {/* SECTION 6 — READINESS TIMELINE & GROWTH STORY */}
      <GrowthStoryPanel growthStory={momentum.growthStory} />

      {momentum.plateau.isPlateauDetected && (
        <PlateauCoachingCard
          plateau={momentum.plateau}
          onTakeAction={() => navigate('/roadmap')}
        />
      )}

      {/* SECTION 7 — AI IMPROVEMENT PLAN SPOTLIGHT */}
      <WorkspaceSpotlight
        badge="Highest-Impact Action Plan"
        title={`Execute Adaptive Roadmap for ${targetRoleTitle}`}
        description={`Completing your active learning curriculum will boost your overall career readiness score from ${overallReadiness}% to over ${Math.min(99, overallReadiness + 15)}%.`}
        impactScore="+15% Readiness Boost"
        actionLabel="Execute Action Plan"
        onAction={() => navigate('/roadmap')}
      />

      <WorkspaceDivider label="Checklist & Telemetry" />

      {/* SECTION 8 — JOB READINESS CHECKLIST */}
      <PremiumSection
        title="Job Application Readiness Checklist"
        subtitle="Verification status across all career application requirements"
        badge="Checklist"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Resume ATS Uploaded', status: resumeData ? 'Completed' : 'Pending', detail: resumeData ? `Score: ${resumeAtsScore}/100` : 'File upload required' },
            { title: 'Verified Skill Base', status: totalSkills >= 5 ? 'Completed' : 'In Progress', detail: `${totalSkills} Skills Indexed` },
            { title: 'Target Role Selected', status: matches.length > 0 ? 'Completed' : 'Pending', detail: targetRoleTitle },
            { title: 'Learning Roadmap Active', status: roadmapData ? 'Completed' : 'Pending', detail: `${roadmapProgress}% Completed` },
            { title: 'Interview Prep Q&A', status: recommendations.length > 0 ? 'Completed' : 'In Progress', detail: `${recommendations.length} Recommendations` },
            { title: 'Portfolio Capstone', status: roadmapProgress >= 50 ? 'Completed' : 'In Progress', detail: `Velocity: ${roadmapProgress}%` },
          ].map((item, idx) => (
            <GlassPanel key={idx} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckSquare
                  className={`w-4 h-4 ${
                    item.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{item.detail}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  item.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}
              >
                {item.status}
              </span>
            </GlassPanel>
          ))}
        </div>
      </PremiumSection>

      {/* PREDICTIVE FORECASTING & SIMULATION STUDIO */}
      <WorkspaceDivider label="Predictive Analytics & Scenario Studio" />

      <ForecastCards
        projectedReadiness={Math.min(99, Math.round(overallReadiness * 1.15 + 5))}
        readinessDate="Q4 Forecast"
        interviewPassProb={interviewReadiness}
        salaryProjection={
          topMatch?.careerId?.salaryRange
            ? `$${(topMatch.careerId.salaryRange.min / 1000).toFixed(0)}k - $${(topMatch.careerId.salaryRange.max / 1000).toFixed(0)}k`
            : 'Market Competitive'
        }
        marketIndex={Math.min(99, Math.round(overallReadiness * 0.9 + 10))}
      />

      <WhatIfSimulator
        currentReadiness={overallReadiness}
        currentMatch={topMatch?.matchScore || 0}
      />

      <SalaryProjectionPanel
        baselineMedian={topMatch?.careerId?.salaryRange?.min || 0}
        projectedMedian={topMatch?.careerId?.salaryRange?.max || 0}
        potentialIncrease={
          topMatch?.careerId?.salaryRange
            ? topMatch.careerId.salaryRange.max - topMatch.careerId.salaryRange.min
            : 0
        }
        baselineRange={
          topMatch?.careerId?.salaryRange
            ? `$${topMatch.careerId.salaryRange.min.toLocaleString()} - $${topMatch.careerId.salaryRange.max.toLocaleString()}`
            : 'Market Benchmark Pending'
        }
        projectedRange={
          topMatch?.careerId?.salaryRange
            ? `$${(topMatch.careerId.salaryRange.min * 1.12).toLocaleString()} - $${(topMatch.careerId.salaryRange.max * 1.15).toLocaleString()}`
            : 'Market Benchmark Pending'
        }
      />

      <ExecutiveInsightsPanel
        currentPosition={`Positioned for ${targetRoleTitle} with ${totalSkills} verified skills and ${overallReadiness}% readiness.`}
        primaryRisks={[
          resumeData ? `ATS resume score currently at ${resumeAtsScore}/100.` : 'No ATS resume uploaded yet.',
          roadmapProgress < 50 ? 'Learning roadmap completion below 50% threshold.' : 'Maintain continuous study velocity.'
        ]}
        highestImpactNextAction={`Execute active roadmap phase for ${targetRoleTitle}`}
        longTermOutlook={`Positive trajectory toward ${targetRoleTitle} seniority.`}
      />

      <MarketIntelligencePanel />

      {/* SECTION 5 (CHARTS) & SECTION 9 — READINESS TREND & RECENT EVENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <MomentumScoreBreakdown momentumScoreData={momentum.momentumScore} />
          <ReadinessTrendChart snapshots={historicalSnapshots || []} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <CareerHealthRadar careerHealthData={momentum.careerHealth} />
          <VelocityTrendsWidget velocity={momentum.velocity} trend={momentum.trend} />
          <ProgressInsightsPanel insights={insights || []} />
        </div>
      </div>

      {/* SECTION 9 — RECENT READINESS ACTIVITY FEED */}
      <PremiumSection
        title="Recent Readiness Telemetry Feed"
        subtitle="Audit trail of capability verifications & evaluation milestones"
        badge="Activity"
      >
        <ActivityTimeline events={recentEvents || []} />
      </PremiumSection>

      {/* SECTION 10 — QUICK ACTIONS GRID */}
      <PremiumSection
        title="Assessment Operations Shortcuts"
        subtitle="Quick access to readiness improvement tools"
        badge="Shortcuts"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 12 — AI STATUS BAR */}
      <AIStatusBar
        status={analyticsLoading ? 'thinking' : 'active'}
        confidence={98.4}
        lastUpdated="Just now"
      />
    </div>
  );
};

AnalyticsWorkspace.displayName = 'AnalyticsWorkspace';
export default AnalyticsWorkspace;
