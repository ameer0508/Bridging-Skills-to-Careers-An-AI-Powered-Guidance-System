import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export interface FeatureRecord {
  name: string;
  domain: string;
  version: string;
  dataType: string;
  description: string;
  freshness: string;
  lastComputed: string;
  sampleValue: string | number;
  dependencies: string[];
  downstreamModels: string[];
}

export const AIFeatureExplorerWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>('career_match_score');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Catalog Dataset
  const featuresList: FeatureRecord[] = useMemo(
    () => [
      {
        name: 'career_match_score',
        domain: 'Match',
        version: 'v1.0',
        dataType: 'float',
        description: 'Multi-criteria career alignment score computed from skill similarity and experience fit.',
        freshness: '< 1 min ago',
        lastComputed: '20:18:12',
        sampleValue: 89.0,
        dependencies: ['resume_experience_years', 'skills_total_count', 'market_demand_velocity'],
        downstreamModels: ['CareerMatchingEngine', 'RecommendationsEngine'],
      },
      {
        name: 'career_readiness_score',
        domain: 'Readiness',
        version: 'v1.0',
        dataType: 'float',
        description: 'Composite career readiness percentage incorporating skill gaps and course velocity.',
        freshness: '< 2 mins ago',
        lastComputed: '20:17:45',
        sampleValue: 86.5,
        dependencies: ['skill_gap_count', 'learning_velocity'],
        downstreamModels: ['CareerReadinessPage', 'AdaptiveRoadmapBuilder'],
      },
      {
        name: 'learning_velocity',
        domain: 'Progress',
        version: 'v1.0',
        dataType: 'float',
        description: 'Weekly course completion velocity normalized across active learning paths.',
        freshness: '5 mins ago',
        lastComputed: '20:14:00',
        sampleValue: 1.0,
        dependencies: ['completed_courses_count'],
        downstreamModels: ['PredictiveAnalyticsEngine'],
      },
      {
        name: 'market_demand_velocity',
        domain: 'Market',
        version: 'v1.0',
        dataType: 'float',
        description: 'YoY hiring demand acceleration percentage extracted from External Intelligence Gateway.',
        freshness: '12 mins ago',
        lastComputed: '20:07:00',
        sampleValue: 32.4,
        dependencies: ['job_postings_24h'],
        downstreamModels: ['MarketIntelligenceEngine', 'SalaryIntelligenceEngine'],
      },
      {
        name: 'resume_experience_years',
        domain: 'Resume',
        version: 'v1.0',
        dataType: 'float',
        description: 'Total professional experience years extracted by Resume Intelligence Engine.',
        freshness: 'Fresh',
        lastComputed: '20:10:04',
        sampleValue: 4.5,
        dependencies: ['resume_parsed_payload'],
        downstreamModels: ['SkillIntelligenceService'],
      },
    ],
    []
  );

  // Filtered Features
  const filteredFeatures = useMemo(() => {
    let list = [...featuresList];
    if (selectedDomain !== 'all') {
      list = list.filter((f) => f.domain.toLowerCase() === selectedDomain.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return list;
  }, [featuresList, selectedDomain, searchQuery]);

  // Selected Feature Details
  const selectedFeature = useMemo(
    () => featuresList.find((f) => f.name === selectedFeatureName) || featuresList[0],
    [featuresList, selectedFeatureName]
  );

  // Materialization Refresh Trigger
  const handleMaterialize = () => {
    setIsRefreshing(true);
    addToast({
      type: 'info',
      message: `Triggering feature materialization pipeline for [${selectedFeature.name}]...`,
    });
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'success',
        message: `Materialized and dual-wrote [${selectedFeature.name}] to Online & Offline stores in 0.8ms!`,
      });
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge AI Feature Store & Memory Explorer"
        subtitle="Centralized catalog serving reusable, versioned, validated machine learning features and longitudinal user memory"
        badge="Feature Store Platform"
        badgeColor="indigo"
        metrics={[
          { label: 'Feature Domains', value: '12 Domains', change: '100% Validated', trend: 'up' },
          { label: 'Online Lookup Latency', value: '< 1 ms', change: 'TTL Memory Cache', trend: 'up' },
          { label: 'Cache Hit Ratio', value: '100.0%', change: 'Dual-Store Serving', trend: 'up' },
          { label: 'Offline Snapshots', value: '1,420 Records', change: 'Model Retraining', trend: 'up' },
        ]}
      />

      {/* TOP CONTROLS & REFRESH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-aurora-violet/25">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-aurora-ink">Central Feature Registry & Lineage Engine</h3>
            <span className="text-[11px] text-aurora-muted">
              OnlineStore (Low-Latency) • OfflineStore (Historical Append Snapshots)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleMaterialize}
            disabled={isRefreshing}
            className="py-2 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Materializing...' : 'Materialize Feature Vector'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* DOMAIN FILTER PILLS & SEARCH */}
      <GlassPanel className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full sm:w-auto">
            {['all', 'match', 'readiness', 'progress', 'market', 'resume'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  selectedDomain === d
                    ? 'text-white [background:var(--aurora-gradient-action)] shadow-aurora-sm shadow-indigo-600/30'
                    : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-muted hover:text-aurora-indigo'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feature registry..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-aurora-muted absolute left-3 top-2.5" />
          </div>
        </div>
      </GlassPanel>

      {/* CATALOG & DETAILS (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FEATURE CATALOG GRID (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-aurora-indigo" />
              Registered Features Catalog ({filteredFeatures.length})
            </span>
            <span className="text-[10px] text-aurora-violet font-bold bg-aurora-violet/[0.06] px-2 py-0.5 rounded">
              v1.0 Schemas
            </span>
          </div>

          <div className="space-y-3">
            {filteredFeatures.map((feat) => {
              const isSelected = selectedFeatureName === feat.name;
              return (
                <div
                  key={feat.name}
                  onClick={() => setSelectedFeatureName(feat.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-violet-50 border-indigo-500 shadow-lg shadow-indigo-600/30'
                      : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-aurora-canvas text-aurora-indigo text-[10px] font-bold border border-aurora-line">
                        {feat.domain}
                      </span>
                      <h4 className="text-xs font-bold text-aurora-ink tabular-nums">{feat.name}</h4>
                    </div>

                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {feat.freshness}
                    </span>
                  </div>

                  <p className="text-[11px] text-aurora-muted line-clamp-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* FEATURE DETAILS & LINEAGE INSPECTOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-aurora-violet" />
                Feature Lineage & Value Inspector
              </span>
              <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-violet text-[10px] font-bold">
                {selectedFeature.version}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-aurora-ink tabular-nums">{selectedFeature.name}</h3>
              <p className="text-xs text-aurora-muted leading-relaxed">
                {selectedFeature.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-0.5">
                <span className="text-[9px] text-aurora-muted block uppercase">Sample Value</span>
                <span className="text-emerald-700 font-bold">{selectedFeature.sampleValue}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-0.5">
                <span className="text-[9px] text-aurora-muted block uppercase">Data Type</span>
                <span className="text-aurora-violet font-bold">{selectedFeature.dataType}</span>
              </div>
            </div>

            {/* Upstream Dependencies */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-aurora-muted uppercase">Upstream Input Signals</span>
              <div className="space-y-1 text-xs tabular-nums">
                {selectedFeature.dependencies.map((dep, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-indigo flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-aurora-indigo" />
                    <span>{dep}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Downstream Consumers */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-aurora-muted uppercase">Downstream AI Consumers</span>
              <div className="space-y-1 text-xs tabular-nums">
                {selectedFeature.downstreamModels.map((consumer, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-violet flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-aurora-violet" />
                    <span>{consumer}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="idle"
        provider="Built-in sample content"
      />
    </div>
  );
};

export default AIFeatureExplorerWorkspace;
