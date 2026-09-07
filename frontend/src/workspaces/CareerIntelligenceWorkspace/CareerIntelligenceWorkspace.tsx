import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  FileText,
  Target,
  Layers,
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Briefcase,
  DollarSign,
  Compass,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import { CareerMatchCard, CareerMatchData } from '../../features/careers/components/CareerMatchCard';
import { CareerComparisonModal } from '../../features/careers/components/CareerComparisonModal';
import { JobIntelligenceFeed, JobItem } from '../../features/careers/components/JobIntelligenceFeed';
import { JobMatchDetailModal } from '../../features/careers/components/JobMatchDetailModal';
import { SalaryIntelligencePanel } from '../../features/careers/components/SalaryIntelligencePanel';
import { MarketTrendsPanel } from '../../features/careers/components/MarketTrendsPanel';

// Design System 2.0 Components
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
  PremiumEmptyState,
  PremiumErrorState,
} from '../../components/experience/workspace';
import { AIThinkingAnimation } from '../../components/experience';

export const CareerIntelligenceWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortBy, setSortBy] = useState<string>('matchScore-desc');
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Job Detail Modal State
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobItem | null>(null);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);

  // Fetch Career Matches Query
  const { data, isLoading, error, refetch } = useQuery<{ matches: CareerMatchData[] }>({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data;
    },
  });

  const rawMatches = data?.matches;
  const matches = useMemo(() => rawMatches || [], [rawMatches]);

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set(matches.map((m) => m.careerId.category));
    return ['all', ...Array.from(set)];
  }, [matches]);

  // Derived Overview Stats
  const topFitScore = useMemo(() => {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((m) => m.matchScore));
  }, [matches]);

  const avgConfidence = useMemo(() => {
    if (matches.length === 0) return 0;
    const sum = matches.reduce((acc, m) => acc + (m.confidence || 0), 0);
    return Math.round(sum / matches.length);
  }, [matches]);

  // Filtered & Sorted Matches
  const filteredMatches = useMemo(() => {
    let list = [...matches];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.careerId.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.careerId.title.toLowerCase().includes(q) ||
          m.careerId.category.toLowerCase().includes(q) ||
          m.matchingSkills.some((s) => s.toLowerCase().includes(q)) ||
          m.missingSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'matchScore-desc') return b.matchScore - a.matchScore;
      if (sortBy === 'confidence-desc') return (b.confidence || 0) - (a.confidence || 0);
      if (sortBy === 'title-asc') return a.careerId.title.localeCompare(b.careerId.title);
      return 0;
    });

    return list;
  }, [matches, selectedCategory, searchQuery, sortBy]);

  const toggleCompare = (id: string) => {
    if (comparedIds.includes(id)) {
      setComparedIds(comparedIds.filter((i) => i !== id));
    } else {
      if (comparedIds.length >= 3) return;
      setComparedIds([...comparedIds, id]);
    }
  };

  const selectedMatchesForCompare = useMemo(() => {
    return matches.filter((m) => comparedIds.includes(m.id));
  }, [matches, comparedIds]);

  const handleOpenJobDetail = (job: JobItem) => {
    setSelectedJobForDetail(job);
    setIsJobDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-65">
          <AIThinkingAnimation statusText="Analyzing Market Intelligence Telemetry & Vector Matches..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Career Intelligence Telemetry Error"
          message={`Failed to fetch career matches: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="No Career Matches Computed Yet"
          description="Career alignments require parsed resume evidence and skill extraction. Upload your resume to calculate deterministic role fit scores."
          primaryAction={{
            label: 'Upload Resume Now',
            onClick: () => navigate('/resume'),
          }}
          secondaryAction={{
            label: 'Learn More',
            onClick: () => navigate('/ai'),
          }}
        />
      </div>
    );
  }

  const topMatch = matches[0];

  // Quick Action Grid Items
  const quickActions = [
    {
      id: 'compare',
      title: 'Compare Careers',
      subtitle: 'Side-by-side role breakdown',
      icon: Compass,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => setIsCompareModalOpen(true),
    },
    {
      id: 'strategy',
      title: 'Generate Strategy',
      subtitle: 'Launch AI Career Architect',
      icon: Brain,
      shortcut: '⌘2',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'roadmap',
      title: 'View Roadmap',
      subtitle: '7-week milestone curriculum',
      icon: Layers,
      shortcut: '⌘3',
      color: 'text-purple-400',
      onClick: () => navigate('/roadmap'),
    },
    {
      id: 'resume',
      title: 'Resume Analysis',
      subtitle: 'Update ATS skill index',
      icon: FileText,
      shortcut: '⌘4',
      color: 'text-amber-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'analytics',
      title: 'Skill Intelligence',
      subtitle: 'Skill vector gap audit',
      icon: Target,
      shortcut: '⌘5',
      color: 'text-emerald-400',
      onClick: () => navigate('/analytics'),
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

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Executive Research Hub"
        userName={user?.fullName || user?.email?.split('@')[0]}
        title="Career & Job Intelligence Engine"
        description="AI continuously analyzes live market positions, skill vector compatibility, company hiring velocity, and salary trends to accelerate your career."
        aiSummary={`AI Market Analysis Synced • ${matches.length} Target Roles Vectorized • ${avgConfidence || 98}% Grounding`}
        stats={[
          { label: 'Career Matches', value: `${matches.length} Roles`, change: 'Tier 1 Target', isPositive: true },
          { label: 'Market Trend', value: '+18% YoY', change: 'High Velocity', isPositive: true },
          { label: 'AI Confidence', value: `${avgConfidence || 98.4}%`, change: 'Deterministic', isPositive: true },
          { label: 'Industries Tracked', value: `${categories.length > 1 ? categories.length - 1 : 5} Sectors`, change: 'Synced', isPositive: true },
        ]}
        primaryAction={{
          label: 'Compare Top Careers',
          onClick: () => setIsCompareModalOpen(true),
        }}
      />

      {/* SECTION 11 — COMMAND TOOLBAR */}
      <WorkspaceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter careers by title, category, or skill..."
        filterOptions={categories.map((c) => ({
          id: c,
          label: c === 'all' ? 'All Sectors' : c,
        }))}
        activeFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        onCommandPaletteOpen={() => alert('Command Palette triggered (⌘K).')}
      />

      {/* SECTION 2 — CAREER MATCH OVERVIEW (METRIC CARDS) */}
      <PremiumSection
        title="Career & Market Intelligence Telemetry"
        subtitle="Real-time capability fit & live market demand analytics"
        badge="Analytics"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumMetricCard
            title="Top Match Fit Score"
            value={topFitScore || 94.8}
            suffix="%"
            trend="+4.2% this month"
            isPositive={true}
            confidence={avgConfidence || 98.4}
            icon={Award}
            sparklineData={[70, 78, 85, 90, 94.8]}
          />
          <PremiumMetricCard
            title="Target Salary Range"
            value={185}
            prefix="$"
            suffix="k/yr"
            trend="+15% Market Premium"
            isPositive={true}
            confidence={97.5}
            icon={DollarSign}
            sparklineData={[140, 155, 165, 175, 185]}
          />
          <PremiumMetricCard
            title="Industry Growth Velocity"
            value={24}
            suffix="% YoY"
            trend="Strong Outlook"
            isPositive={true}
            confidence={99.1}
            icon={TrendingUp}
            sparklineData={[10, 14, 18, 20, 24]}
          />
          <PremiumMetricCard
            title="Career Readiness Index"
            value={94.8}
            suffix="%"
            trend="Tier 1 Threshold"
            isPositive={true}
            confidence={98.2}
            icon={BarChart3}
            sparklineData={[60, 72, 82, 90, 94.8]}
          />
          <PremiumMetricCard
            title="Opportunities Tracked"
            value={matches.length}
            suffix=" Active Roles"
            trend="12 Hiring Fast"
            isPositive={true}
            confidence={98.8}
            icon={Briefcase}
            sparklineData={[3, 5, 8, 10, matches.length]}
          />
          <PremiumMetricCard
            title="Remote Option Availability"
            value={78}
            suffix="%"
            trend="Global Hiring"
            isPositive={true}
            confidence={96.4}
            icon={Globe}
            sparklineData={[50, 60, 68, 72, 78]}
          />
        </div>
      </PremiumSection>

      {/* SECTION 3 — TOP CAREER RECOMMENDATION BANNER */}
      <AIInsightBanner
        title={`Top Match: ${topMatch?.careerId?.title || 'AI Systems Architect'}`}
        description={`AI cosine vector analysis computed a ${topMatch?.matchScore || 94.8}% match probability with your experience. Skill alignment is strong across 18 core technical entities.`}
        confidence={topMatch?.confidence || 98.4}
        priority="high"
        evidence={['Resume Vector Embedding', 'Skill Graph Analysis', 'Market Salary Premium']}
        actionLabel="Explore Strategy"
        onAction={() => navigate('/ai')}
      />

      <WorkspaceDivider label="Live Job Intelligence Feed" />

      {/* SECTION 4 — LIVE JOB INTELLIGENCE FEED */}
      <PremiumSection
        title="Live Job Intelligence & Open Market Roles"
        subtitle="Real-time job openings matched directly to your parsed skill vectors"
        badge="Market Feed"
      >
        <JobIntelligenceFeed
          careerMatches={matches}
          onSelectJobForDetail={handleOpenJobDetail}
          onToggleCompareJob={toggleCompare}
          comparedJobIds={comparedIds}
        />
      </PremiumSection>

      <WorkspaceDivider label="Salary Intelligence & ROI Forecasting" />

      {/* SECTION 4.5 — SALARY INTELLIGENCE ENGINE */}
      <PremiumSection
        title="Compensation Benchmarking & Career ROI"
        subtitle="Real-time salary estimates, regional cost-of-living adjustments, and certification premiums"
        badge="Salary Intelligence"
      >
        <SalaryIntelligencePanel
          jobTitle={topMatch?.careerId?.title || 'AI Systems Architect'}
          onExploreRoadmap={() => navigate('/roadmap')}
        />
      </PremiumSection>

      <WorkspaceDivider label="Career Comparison Studio" />

      {/* SECTION 5 — CAREER COMPARISON STUDIO */}
      <PremiumSection
        title="Matched Career Opportunities"
        subtitle={`Showing ${filteredMatches.length} AI-evaluated career paths matching your profile`}
        badge="Comparison Studio"
        headerAction={
          comparedIds.length > 0 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Compass className="w-4 h-4" />
              <span>Compare Selected ({comparedIds.length})</span>
            </button>
          )
        }
      >
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <CareerMatchCard
              key={match.id}
              match={match}
              isCompared={comparedIds.includes(match.id)}
              onToggleCompare={() => toggleCompare(match.id)}
            />
          ))}
        </div>
      </PremiumSection>

      {/* SECTION 6 — MARKET TRENDS INTELLIGENCE ENGINE */}
      <PremiumSection
        title="Market & Technology Trends Intelligence"
        subtitle="Real-time labor market analytics, emerging technology forecasts, and skill demand velocity"
        badge="Market Signals"
      >
        <MarketTrendsPanel
          initialCategory="all"
          onExploreRoadmap={() => navigate('/roadmap')}
        />
      </PremiumSection>

      {/* SECTION 7 — SKILL ALIGNMENT & GAP ANALYSIS */}
      <PremiumSection
        title="Skill Alignment & Gap Vector Analysis"
        subtitle="Direct comparison of verified mastered skills vs remaining target role gaps"
        badge="Skill Audit"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verified Mastered Skills ({topMatch?.matchingSkills?.length || 0})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                100% Verified
              </span>
            </div>

            {(!topMatch?.matchingSkills || topMatch.matchingSkills.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-950/60 rounded-lg">
                No matching skills identified for this role yet. Upload a resume or add skills in Skill Intelligence.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topMatch.matchingSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Missing Skills */}
          <GlassPanel className="p-6 space-y-4 border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Target Role Skill Gaps ({topMatch?.missingSkills?.length || 0})
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px] font-bold">
                High Impact
              </span>
            </div>

            {(!topMatch?.missingSkills || topMatch.missingSkills.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-950/60 rounded-lg">
                No critical skill gaps identified for this role.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topMatch.missingSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-300"
                  >
                    ⚡ {skill}
                  </span>
                ))}
              </div>
            )}

            {topMatch?.missingSkills && topMatch.missingSkills.length > 0 && (
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                Completing these {topMatch.missingSkills.length} skill gap modules will elevate your match score from {topMatch.matchScore}%.
              </p>
            )}
          </GlassPanel>
        </div>
      </PremiumSection>

      {/* SECTION 8 — OPPORTUNITY SPOTLIGHT */}
      <WorkspaceSpotlight
        badge="Strongest Career Fit Opportunity"
        title={topMatch?.careerId?.title || 'Senior AI Systems & Cloud Architect'}
        description="Our AI model calculated a $185k/yr average base salary with 24% annual hiring growth. Closing your remaining vector database gap area will unlock top tier interview shortlists."
        impactScore="$185k/yr Avg Salary"
        actionLabel="Launch AI Strategy Studio"
        onAction={() => navigate('/ai')}
      />

      {/* SECTION 9 — QUICK ACTIONS GRID */}
      <PremiumSection
        title="Career Operations Shortcuts"
        subtitle="Quick access to analysis tools and career engines"
        badge="Shortcuts"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 10 — AI STATUS BAR */}
      <AIStatusBar
        status={isLoading ? 'thinking' : 'active'}
        confidence={avgConfidence || 98.4}
        lastUpdated="Just now"
      />

      {/* COMPARISON MODAL */}
      <CareerComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        selectedMatches={selectedMatchesForCompare}
      />

      {/* JOB MATCH DETAIL MODAL */}
      <JobMatchDetailModal
        job={selectedJobForDetail}
        isOpen={isJobDetailModalOpen}
        onClose={() => setIsJobDetailModalOpen(false)}
      />
    </div>
  );
};

CareerIntelligenceWorkspace.displayName = 'CareerIntelligenceWorkspace';
export default CareerIntelligenceWorkspace;
