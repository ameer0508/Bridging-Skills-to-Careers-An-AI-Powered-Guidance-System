import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Brain, Target, Compass, FileText } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { SkillTelemetryHUD } from './SkillTelemetryHUD';
import { SkillNodeMatrix } from './SkillNodeMatrix';
import { SkillEvidenceModal } from './SkillEvidenceModal';
import { SemanticSkillGraph } from './SemanticSkillGraph';
import { SkillClusterCards } from './SkillClusterCards';
import { TransferableSkillExplorer } from './TransferableSkillExplorer';
import { EmergingSkillSpotlight } from './EmergingSkillSpotlight';
import { CareerRelevancePanel } from './CareerRelevancePanel';

// Design System 2.0 Components
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  PremiumEmptyState,
  PremiumErrorState,
} from '../../../components/experience/workspace';
import { AIThinkingAnimation } from '../../../components/experience';

interface IEvidence {
  sourceType: string;
  description: string;
  weight: number;
}

interface IUserSkill {
  id: string;
  skillId: string;
  name: string;
  evidenceScore: number;
  evidences: IEvidence[];
  aliases: string[];
}

export const SkillIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkillForModal, setSelectedSkillForModal] = useState<IUserSkill | null>(null);

  // Fetch User Skills
  const { data, isLoading, error, refetch } = useQuery<{
    categories: Record<string, IUserSkill[]>;
    totalSkills: number;
  }>({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  const categories = useMemo(() => data?.categories || {}, [data]);
  const totalSkills = data?.totalSkills || 0;
  const categoryKeys = useMemo(() => ['all', ...Object.keys(categories)], [categories]);

  // Compute Peak Evidence Score & Top Category
  const maxScore = useMemo(() => {
    let max = 0;
    Object.values(categories).forEach((skills) => {
      skills.forEach((s) => {
        if (s.evidenceScore > max) max = s.evidenceScore;
      });
    });
    return max || 95;
  }, [categories]);

  const topCategory = useMemo(() => {
    let topCat = 'AI & Engineering';
    let maxCount = 0;
    Object.entries(categories).forEach(([cat, skills]) => {
      if (skills.length > maxCount) {
        maxCount = skills.length;
        topCat = cat;
      }
    });
    return topCat;
  }, [categories]);

  // Filter skills by search query & category selection
  const filteredCategories = useMemo(() => {
    const result: Record<string, IUserSkill[]> = {};

    Object.entries(categories).forEach(([cat, skills]) => {
      if (selectedCategory !== 'all' && cat !== selectedCategory) return;

      const filtered = skills.filter((skill) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          skill.name.toLowerCase().includes(q) ||
          (skill.aliases && skill.aliases.some((a) => a.toLowerCase().includes(q)))
        );
      });

      if (filtered.length > 0) {
        result[cat] = filtered;
      }
    });

    return result;
  }, [categories, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Indexing Skill Taxonomy Vector Graph..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Skill Intelligence Telemetry Connection Error"
          message={`Failed to load skill taxonomy graph: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (totalSkills === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="No Verified Skills Extracted Yet"
          description="Skill intelligence requires evidence parsing from your experience. Upload your resume to extract deterministic skill taxonomy vectors."
          primaryAction={{
            label: 'Upload Resume Now',
            onClick: () => navigate('/resume'),
          }}
          secondaryAction={{
            label: 'Explore AI Strategy',
            onClick: () => navigate('/ai'),
          }}
        />
      </div>
    );
  }

  const quickActions = [
    {
      id: 'ai',
      title: 'Ask AI Architect',
      subtitle: 'Skill gap advisory',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'careers',
      title: 'Career Matches',
      subtitle: 'Skill alignment score',
      icon: Target,
      shortcut: '⌘2',
      color: 'text-indigo-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'resume',
      title: 'Resume Studio',
      subtitle: 'Parser evidence',
      icon: FileText,
      shortcut: '⌘3',
      color: 'text-emerald-400',
      onClick: () => navigate('/resume'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — HERO TELEMETRY HUD */}
      <SkillTelemetryHUD
        totalSkills={totalSkills}
        topCategory={topCategory}
        maxScore={maxScore}
      />

      {/* SECTION 2 — SEARCH & CATEGORY FILTER BAR */}
      <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills or aliases..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3 — SKILL NODE MATRIX */}
      <PremiumSection
        title="Verified Skill Taxonomy Matrix"
        subtitle="Click any skill node to view exact resume evidence records"
        badge="Taxonomy"
      >
        <SkillNodeMatrix
          categories={filteredCategories}
          onSelectSkill={(skill) => setSelectedSkillForModal(skill)}
        />
      </PremiumSection>

      <WorkspaceDivider label="Visual Knowledge Graph & Advanced Insights" />

      {/* SECTION 4 — SEMANTIC SKILL KNOWLEDGE GRAPH */}
      <PremiumSection
        title="2D Knowledge Relationship Graph"
        subtitle="Visual vector relationships and prerequisite connections between skills"
        badge="Knowledge Graph"
      >
        <SemanticSkillGraph />
      </PremiumSection>

      {/* SECTION 5 — CLUSTERS & TRANSFERABLE SKILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillClusterCards />
        <TransferableSkillExplorer />
      </div>

      {/* SECTION 6 — EMERGING SKILLS & CAREER RELEVANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmergingSkillSpotlight />
        <CareerRelevancePanel />
      </div>

      {/* SECTION 7 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 8 — LIVE AI STATUS FOOTER */}
      <AIStatusBar
        status="active"
        confidence={95.0}
        lastUpdated="Just now"
      />

      {/* SKILL EVIDENCE MODAL DRAWER */}
      <SkillEvidenceModal
        skill={selectedSkillForModal}
        onClose={() => setSelectedSkillForModal(null)}
      />
    </div>
  );
};

export default SkillIntelligencePage;
