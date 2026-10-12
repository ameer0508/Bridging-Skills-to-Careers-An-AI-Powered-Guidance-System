import React, { useState, useMemo, useEffect } from 'react';
import { messageOf } from '../../lib/collections';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  FileText,
  Target,
  Layers,
  Award,
  CheckCircle2,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import { CareerMatchCard, CareerMatchData } from '../../features/careers/components/CareerMatchCard';
import { CareerComparisonModal } from '../../features/careers/components/CareerComparisonModal';
import { CareerDemandPanel, CareerSalaryPanel, JobListingsPointer } from '../../features/careers/components/CareerMarketFacts';
import { CareerAlignmentLabView } from '../../features/careers/components/CareerAlignmentLabView';

// Design System 2.0 Components
import {
  WorkspaceHero,
  AIInsightBanner,
  QuickActionGrid,
  WorkspaceSpotlight,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  GlassPanel,
  WorkspaceToolbar,
  PremiumErrorState,
} from '../../components/experience/workspace';
import { AIThinkingAnimation } from '../../components/experience';

interface MatchBreakdownRow {
  skillName: string;
  importance: 'required' | 'preferred' | 'supporting';
  status: 'applied' | 'listed' | 'inferred' | 'missing';
  matchedVia?: string;
  pointsEarned: number;
  pointsPossible: number;
}

const BREAKDOWN_STATUS_LABEL: Record<MatchBreakdownRow['status'], string> = {
  applied: 'Used in a role or project',
  listed: 'Listed only',
  inferred: 'Inferred from a related skill',
  missing: 'Not found',
};

export const CareerIntelligenceWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
   
  const [sortBy] = useState<string>('matchScore-desc');
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Resume status query to monitor real-time background parsing
  const { data: resumeData } = useQuery({
    queryKey: ['resumes', 'me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/resumes/me');
        return response.data?.data?.resume || null;
      } catch {
        return null;
      }
    },
    refetchInterval: (query) => {
      const status = query.state.data?.parsingStatus;
      if (status === 'pending' || status === 'processing') {
        return 2000;
      }
      return false;
    },
  });

  // Resume upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await apiClient.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

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

  // When parsing transitions to completed, refetch matches automatically
  useEffect(() => {
    if (resumeData?.parsingStatus === 'completed' && matches.length === 0) {
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
    }
  }, [resumeData?.parsingStatus, matches.length, queryClient]);

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set(matches.map((m) => m.careerId.category));
    return ['all', ...Array.from(set)];
  }, [matches]);

  // Derived Overview Stats


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
    const uploadStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error' =
      uploadMutation.isPending
        ? 'uploading'
        : resumeData?.parsingStatus === 'processing' || resumeData?.parsingStatus === 'pending'
          ? 'processing'
          : resumeData?.parsingStatus === 'completed'
            ? 'completed'
            : uploadMutation.isError || resumeData?.parsingStatus === 'failed'
              ? 'error'
              : 'idle';

    const errorMessage = uploadMutation.error
      ? messageOf(uploadMutation.error, 'The upload failed.')
      : resumeData?.parsingStatus === 'failed'
        ? 'Resume evidence extraction failed. Please ensure the document is not password-protected or corrupted.'
        : undefined;

    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4">
        <CareerAlignmentLabView
          onUpload={(file: File) => uploadMutation.mutate(file)}
          isUploading={uploadStatus === 'uploading'}
          parsingStatus={uploadStatus === 'processing' ? 'processing' : uploadStatus === 'completed' ? 'completed' : null}
          validationError={uploadStatus === 'error' ? errorMessage : null}
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
        greeting="Career matches"
        userName={user?.fullName || user?.email?.split('@')[0]}
        title="Career Intelligence"
        description="Careers ranked by how much of each role's skill baseline your resume evidences. Scores are calculated from your resume only and are not predictions of hiring outcomes."
        aiSummary={`${matches.length} career${matches.length === 1 ? '' : 's'} matched from your resume evidence`}
        stats={[
          { label: 'Career Matches', value: matches.length },
          { label: 'Top Match', value: `${topMatch?.matchScore ?? 0}%`, change: topMatch?.careerId?.title },
          { label: 'Skills Evidenced', value: topMatch?.matchingSkills?.length ?? 0, change: 'for the top match' },
          { label: 'Skills Missing', value: topMatch?.missingSkills?.length ?? 0, change: 'for the top match', isPositive: false },
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

      {/* SECTION 2 — TOP MATCH EXPLANATION */}
      <AIInsightBanner
        title={`Top match: ${topMatch?.careerId?.title ?? 'none yet'} (${topMatch?.matchScore ?? 0}%)`}
        description={
          topMatch?.summary ||
          'The match score is the weighted share of this career\'s skills that your resume evidences.'
        }
        confidence={typeof topMatch?.confidence === 'number' ? topMatch.confidence : undefined}
        priority="high"
        evidence={(topMatch?.strengths || []).slice(0, 3)}
        actionLabel="See readiness and gaps"
        onAction={() => navigate('/readiness')}
      />

      {Array.isArray(topMatch?.breakdown) && topMatch.breakdown.length > 0 && (
        <PremiumSection
          title="How this score was calculated"
          subtitle="Each skill the career expects, and the evidence found for it on your resume"
          badge="Explanation"
        >
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-2">Skill</th>
                  <th scope="col" className="px-3 py-2">Importance</th>
                  <th scope="col" className="px-3 py-2">Evidence on your resume</th>
                  <th scope="col" className="px-3 py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {topMatch.breakdown.map((row: MatchBreakdownRow, index: number) => (
                  <tr key={`${row.skillName}-${index}`} className="border-t border-white/5">
                    <td className="px-3 py-2 font-semibold text-white">{row.skillName}</td>
                    <td className="px-3 py-2 capitalize">{row.importance}</td>
                    <td className="px-3 py-2">{BREAKDOWN_STATUS_LABEL[row.status]}{row.status === 'inferred' && row.matchedVia ? ` (${row.matchedVia})` : ''}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.pointsEarned} / {row.pointsPossible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumSection>
      )}

      <WorkspaceDivider label="Job Market Evidence" />

      {/* SECTION 4 — WHAT IS ACTUALLY KNOWN ABOUT THE MARKET: sourced records or "unavailable" */}
      <PremiumSection
        title="Job Market Evidence"
        subtitle="Posting counts and advertised salaries from licensed sources only. Where none exist, this says so instead of showing a figure."
        badge="Sourced Data Only"
      >
        <div className="space-y-4">
          {topMatch?.careerId?._id && <CareerDemandPanel careerId={topMatch.careerId._id} careerTitle={topMatch.careerId.title} />}
          <CareerSalaryPanel />
          <JobListingsPointer />
        </div>
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

      {/* SECTION 8 — STRONGEST MATCH: the stored score and where to explore it, nothing estimated */}
      <WorkspaceSpotlight
        badge="Your strongest match"
        title={topMatch?.careerId?.title || 'No match yet'}
        description={`This is the career your resume evidence covers best. ${topMatch?.missingSkills?.length ?? 0} of its skills are not on your profile yet. The Career Lab shows what would change the score; no salary or hiring figure is attached because none is sourced.`}
        impactScore={`${topMatch?.matchScore ?? 0}% match`}
        actionLabel="Open Career Lab"
        onAction={() => navigate('/career-lab')}
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
        
        lastUpdated="Just now"
      />

      {/* COMPARISON MODAL */}
      <CareerComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        selectedMatches={selectedMatchesForCompare}
      />

    </div>
  );
};

CareerIntelligenceWorkspace.displayName = 'CareerIntelligenceWorkspace';
export default CareerIntelligenceWorkspace;
