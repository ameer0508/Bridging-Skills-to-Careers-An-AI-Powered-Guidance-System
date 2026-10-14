import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Brain,
  Compass,
  FileText,
  Filter,
  Layers,
} from 'lucide-react';
import apiClient from '../../../lib/axios';

// Components
import { LivingCapabilityHUD } from './LivingCapabilityHUD';
import {
  CapabilityMatrixCanvas,
  type CapabilitySkill,
  type SkillGraphEdge,
} from './CapabilityMatrixCanvas';
import { CapabilityEvidenceInspector } from './CapabilityEvidenceInspector';
import { CapabilityActivationHub } from './CapabilityActivationHub';

// Design System 2.0 Components
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  PremiumErrorState,
} from '../../../components/experience/workspace';
import { AIThinkingAnimation } from '../../../components/experience';

export const SkillIntelligencePage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStrength, setSelectedStrength] = useState<string>('all');
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  // Inspector State
  const [inspectingSkill, setInspectingSkill] = useState<CapabilitySkill | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Query 1: User's Verified Skills
  const {
    data: skillsData,
    isLoading: skillsLoading,
    error: skillsError,
    refetch: refetchSkills,
  } = useQuery<{
    categories: Record<string, CapabilitySkill[]>;
    totalSkills: number;
  }>({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Query 2: Canonical Ontology Graph Edges
  const { data: graphData } = useQuery<{ edges: SkillGraphEdge[] }>({
    queryKey: ['skills', 'graph'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/graph');
      return response.data.data;
    },
  });

  // Query 3: Career Matches (for target role capability coverage & gap analysis)
  const { data: careersData } = useQuery({
    queryKey: ['careers-matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  const categories = useMemo(() => skillsData?.categories || {}, [skillsData]);
  const totalSkills = skillsData?.totalSkills || 0;
  const graphEdges = useMemo(() => graphData?.edges || [], [graphData]);

  // Flatten all skills with category assigned
  const allSkills: CapabilitySkill[] = useMemo(() => {
    return Object.entries(categories).flatMap(([cat, skills]) =>
      skills.map((s) => ({ ...s, category: cat }))
    );
  }, [categories]);

  // Compute Dominant Domain & High-Evidence Counts
  const { topCategory, topCategoryCount, highEvidenceCount } = useMemo(() => {
    let topCat = 'General';
    let maxCount = 0;

    Object.entries(categories).forEach(([cat, skills]) => {
      if (skills.length > maxCount) {
        maxCount = skills.length;
        topCat = cat;
      }
    });

    const highEv = allSkills.filter((s) => s.evidenceScore >= 75).length;

    return {
      topCategory: topCat,
      topCategoryCount: maxCount,
      highEvidenceCount: highEv,
    };
  }, [categories, allSkills]);

  // Target Career context
  const activeCareerId =
    selectedCareerId ||
    (careersData && careersData.length > 0 ? careersData[0].careerId._id : null);

  const activeCareer = useMemo(() => {
    if (!careersData || careersData.length === 0) return null;
    return careersData.find((c: { careerId: { _id: string } }) => c.careerId._id === activeCareerId) || careersData[0];
  }, [careersData, activeCareerId]);

  const targetRoleTitle = activeCareer?.careerId?.title || null;
  // The career-match API names this field `matchingSkills`.
  const matchedSkills: string[] = activeCareer?.matchingSkills || [];
  const missingSkills: string[] = activeCareer?.missingSkills || [];

  // Filter skills by search query, category, and strength tier
  const filteredCategories = useMemo(() => {
    const result: Record<string, CapabilitySkill[]> = {};

    Object.entries(categories).forEach(([cat, skills]) => {
      if (selectedCategory !== 'all' && cat !== selectedCategory) return;

      const filtered = skills.filter((skill) => {
        // 1. Search Query filter (matches name or aliases)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = skill.name.toLowerCase().includes(q);
          const matchesAlias = skill.aliases?.some((a) => a.toLowerCase().includes(q));
          if (!matchesName && !matchesAlias) return false;
        }

        // 2. Strength tier filter
        if (selectedStrength === 'expert' && skill.evidenceScore < 90) return false;
        if (selectedStrength === 'advanced' && (skill.evidenceScore < 70 || skill.evidenceScore >= 90)) return false;
        if (selectedStrength === 'working' && (skill.evidenceScore < 40 || skill.evidenceScore >= 70)) return false;
        if (selectedStrength === 'foundational' && skill.evidenceScore >= 40) return false;

        return true;
      });

      if (filtered.length > 0) {
        result[cat] = filtered;
      }
    });

    return result;
  }, [categories, selectedCategory, selectedStrength, searchQuery]);

  const categoryKeys = useMemo(() => ['all', ...Object.keys(categories)], [categories]);

  const handleSelectSkill = (skill: CapabilitySkill) => {
    setInspectingSkill(skill);
    setIsInspectorOpen(true);
  };

  const handleBridgeGap = () => {
    navigate('/roadmap');
  };

  if (skillsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[280px]">
          <AIThinkingAnimation statusText="Constructing Verified Skill Taxonomy & Living Capability Map..." />
        </div>
      </div>
    );
  }

  if (skillsError) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Skill Taxonomy Telemetry Connection Error"
          message={`Failed to retrieve verified skills: ${(skillsError as Error).message}`}
          onRetry={() => refetchSkills()}
        />
      </div>
    );
  }

  if (totalSkills === 0) {
    return (
      <div className="max-w-7xl mx-auto pb-16 px-4">
        <CapabilityActivationHub />
      </div>
    );
  }

  const quickActions = [
    {
      id: 'ai',
      title: 'Ask AI Architect',
      subtitle: 'Analyze skill capability gaps',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-aurora-violet',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'roadmap',
      title: 'Learning Roadmap',
      subtitle: 'Bridge identified skill gaps',
      icon: Layers,
      shortcut: '⌘2',
      color: 'text-aurora-indigo',
      onClick: () => navigate('/roadmap'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: 'Role match alignment',
      icon: Compass,
      shortcut: '⌘3',
      color: 'text-emerald-700',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'resume',
      title: 'Resume Studio',
      subtitle: 'Update evidence sources',
      icon: FileText,
      shortcut: '⌘4',
      color: 'text-aurora-violet',
      onClick: () => navigate('/resume'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4">
      {/* SECTION 1 — LIVING CAPABILITY TELEMETRY HUD */}
      <LivingCapabilityHUD
        totalSkills={totalSkills}
        topCategory={topCategory}
        topCategoryCount={topCategoryCount}
        highEvidenceCount={highEvidenceCount}
        targetRoleTitle={targetRoleTitle}
        targetMatchedSkillsCount={matchedSkills.length}
        targetTotalRequiredCount={matchedSkills.length + missingSkills.length}
        careers={careersData || []}
        activeCareerId={activeCareerId}
        onSelectCareer={setSelectedCareerId}
      />

      {/* SECTION 2 — INTELLIGENT COMMAND & FILTER STRIP */}
      <div className="p-4 rounded-2xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-aurora-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search competencies or aliases..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 outline-none focus:border-aurora-violet/25 transition-colors"
            />
          </div>

          {/* Strength Level Dropdown Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-aurora-muted flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-aurora-indigo" />
              Strength:
            </span>
            <select
              aria-label="Filter by evidence strength"
              value={selectedStrength}
              onChange={(e) => setSelectedStrength(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink outline-none focus:border-aurora-violet/25 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="expert">Expert (≥90%)</option>
              <option value="advanced">Advanced (70-89%)</option>
              <option value="working">Working (40-69%)</option>
              <option value="foundational">Foundational (&lt;40%)</option>
            </select>
          </div>
        </div>

        {/* Domain Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full custom-scrollbar pb-1 pt-1">
          {categoryKeys.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:text-aurora-indigo hover:border-aurora-line'
                }`}
              >
                {cat === 'all' ? 'All Domains' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 — THE LIVING CAPABILITY MATRIX CANVAS */}
      <CapabilityMatrixCanvas
        categories={filteredCategories}
        allSkills={allSkills}
        graphEdges={graphEdges}
        targetRoleTitle={targetRoleTitle}
        matchedSkills={matchedSkills}
        missingSkills={missingSkills}
        onSelectSkill={handleSelectSkill}
        onBridgeGap={handleBridgeGap}
      />

      <WorkspaceDivider label="Capability Acceleration & Career Actions" />

      {/* SECTION 4 — INTELLIGENCE SHORTCUTS */}
      <PremiumSection
        title="Capability Operations Shortcuts"
        subtitle="Leverage your verified skills across downstream intelligence systems"
        badge="Shortcuts"
      >
        <QuickActionGrid actions={quickActions} columns={4} />
      </PremiumSection>

      {/* SECTION 5 — LIVE AI STATUS FOOTER */}
      <AIStatusBar
        status="active"
        confidence={98.5}
        lastUpdated="Telemetry Live"
      />

      {/* CAPABILITY EVIDENCE INSPECTOR (Slide-over deep inspection studio) */}
      <CapabilityEvidenceInspector
        skill={inspectingSkill}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        graphEdges={graphEdges}
        targetRoleTitle={targetRoleTitle}
      />
    </div>
  );
};

export default SkillIntelligencePage;
