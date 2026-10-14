import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Globe,
  AlertTriangle,
  Flame,
  Clock,
  ArrowUpRight,
  Bookmark,
  Building2,
  Compass,
  Cpu,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GlassPanel } from '../../../components/experience/workspace';
import { useToast } from '../../../components/composite/Toast';

export interface MarketTrendsPanelProps {
  initialCategory?: string;
  onExploreRoadmap?: () => void;
}

export const MarketTrendsPanel: React.FC<MarketTrendsPanelProps> = ({
  initialCategory = 'all',
  onExploreRoadmap,
}) => {
  const { addToast } = useToast();

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCountry] = useState<string>('United States');
  const [trackedSkillNames, setTrackedSkillNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sb-tracked-skills');
    return saved ? JSON.parse(saved) : ['Vector Indexing (Milvus/Pinecone)', 'LangChain & LlamaIndex'];
  });
  const [, setSavedReports] = useState<string[]>([]);

  // Market Telemetry Datasets
  const trendingSkills = [
    { name: 'LangChain & LlamaIndex', category: 'AI Frameworks', demandScore: 97, growthYoY: 42.0, priority: 'High', velocity: 'Ultra High' },
    { name: 'Vector Indexing (Milvus/Pinecone)', category: 'AI Frameworks', demandScore: 94.5, growthYoY: 34.2, priority: 'High', velocity: 'Ultra High' },
    { name: 'PyTorch 2.0 & LLM Fine-Tuning', category: 'AI Frameworks', demandScore: 96, growthYoY: 28.0, priority: 'High', velocity: 'High' },
    { name: 'FastAPI & Microservices', category: 'Programming Languages', demandScore: 92, growthYoY: 31.0, priority: 'High', velocity: 'High' },
    { name: 'Kubernetes Cluster Operations', category: 'DevOps', demandScore: 91, growthYoY: 22.4, priority: 'High', velocity: 'Moderate' },
    { name: 'TypeScript & Next.js 14', category: 'Programming Languages', demandScore: 95, growthYoY: 24.0, priority: 'High', velocity: 'High' },
  ];

  const emergingTech = [
    { name: 'LangChain & LlamaIndex', stage: 'Early Adopters', growth3yr: '+117.6%', score: 96 },
    { name: 'Vector Indexing (Milvus)', stage: 'Early Adopters', growth3yr: '+95.8%', score: 92 },
    { name: 'Autonomous AI Agents', stage: 'Innovators', growth3yr: '+145.0%', score: 88 },
    { name: 'Zero-Knowledge Proofs', stage: 'Innovators', growth3yr: '+82.0%', score: 84 },
  ];

  const decliningSkills = [
    { name: 'Legacy COBOL & Fortran', declineYoY: '-14.2%', risk: 'High', pivot: 'Modern Cloud & Go' },
    { name: 'Manual QA Test Scripting', declineYoY: '-22.5%', risk: 'High', pivot: 'Automated Playwright & AI Testing' },
  ];

  const lifecycleData = [
    { stage: 'Innovators', count: 14, label: 'Autonomous Agents' },
    { stage: 'Early Adopters', count: 32, label: 'Vector DBs & LangChain' },
    { stage: 'Early Majority', count: 48, label: 'PyTorch & FastAPI' },
    { stage: 'Late Majority', count: 28, label: 'Docker & REST APIs' },
    { stage: 'Laggards', count: 8, label: 'COBOL & SOAP' },
  ];

  const regionalDemands = [
    { region: 'San Francisco Bay Area', index: 98.2, remote: '45%', focus: 'AI/ML & Vector DBs' },
    { region: 'New York City, NY', index: 94.0, remote: '52%', focus: 'FinTech AI & Quant' },
    { region: 'Seattle, WA', index: 92.5, remote: '48%', focus: 'Cloud Infra & K8s' },
    { region: 'Austin, TX', index: 89.0, remote: '60%', focus: 'SaaS Architecture' },
    { region: 'Global Remote', index: 96.0, remote: '100%', focus: 'Full-Stack TS & FastAPI' },
  ];

  const industryHealthData = [
    { industry: 'AI & Machine Learning', healthScore: 96.5, growthYoY: '+32.4%', velocity: 'Ultra High' },
    { industry: 'Cloud Infrastructure', healthScore: 92.0, growthYoY: '+24.0%', velocity: 'High' },
    { industry: 'Cybersecurity', healthScore: 90.5, growthYoY: '+26.8%', velocity: 'High' },
    { industry: 'FinTech Systems', healthScore: 88.0, growthYoY: '+18.2%', velocity: 'Moderate' },
  ];

  const forecastTimeline = [
    { year: 'Q1 2024', aiDemand: 78, cloudDemand: 82, devopsDemand: 75 },
    { year: 'Q3 2024', aiDemand: 86, cloudDemand: 85, devopsDemand: 79 },
    { year: 'Q1 2025', aiDemand: 94, cloudDemand: 89, devopsDemand: 84 },
    { year: 'Q3 2025 (Forecast)', aiDemand: 98, cloudDemand: 92, devopsDemand: 88 },
  ];

  // Toggle Track Skill
  const toggleTrackSkill = (name: string) => {
    setTrackedSkillNames((prev) => {
      const next = prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name];
      localStorage.setItem('sb-tracked-skills', JSON.stringify(next));
      addToast({
        type: 'info',
        message: next.includes(name)
          ? `Added ${name} to tracked market skills`
          : `Removed ${name} from tracked skills`,
      });
      return next;
    });
  };

  const handleSaveReport = () => {
    const reportName = `Market Intelligence Report (${selectedCountry} • ${new Date().toLocaleDateString()})`;
    setSavedReports((prev) => [...prev, reportName]);
    addToast({
      type: 'success',
      message: `Exported and saved ${reportName}`,
    });
  };

  // Filtered Skills
  const filteredSkills =
    selectedCategory === 'all' ? trendingSkills : trendingSkills.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* HEADER & TOP CONTROLS */}
      <GlassPanel className="p-6 space-y-4 border-aurora-violet/25 bg-aurora-canvas/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-aurora-ink tracking-tight">
                Global Market Trends & Emerging Technology Engine
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet text-[11px] font-bold">
                8 Data Adapters Active
              </span>
            </div>
            <p className="text-xs text-aurora-muted">
              Continuous labor market analytics tracking technology velocity, hiring demand, and 3-year adoption forecasts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveReport}
              className="py-2 px-3.5 rounded-xl bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-xs font-bold text-aurora-ink hover:text-aurora-indigo flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Bookmark className="w-3.5 h-3.5 text-aurora-violet" />
              <span>Save Market Report</span>
            </button>
            {onExploreRoadmap && (
              <button
                onClick={onExploreRoadmap}
                className="py-2 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View Learning Roadmap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI INSIGHT CARD */}
        <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-aurora-ink block">
              AI Market Velocity Synthesis (Q3 2024 Index)
            </span>
            <p className="text-aurora-muted leading-relaxed">
              <strong className="text-aurora-violet">Vector Indexing (Milvus)</strong> and <strong className="text-aurora-violet">LangChain</strong> lead market demand with <strong className="text-emerald-700">+42% YoY hiring growth</strong> across San Francisco, NYC, and Global Remote markets (example figures, not live market data).
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Top Demand Skill</span>
            <Flame className="w-4 h-4 text-rose-700" />
          </div>
          <span className="text-lg font-bold text-aurora-ink block truncate">LangChain & LLMs</span>
          <span className="text-xs text-emerald-700 font-bold">+42.0% YoY Growth</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Hiring Urgency</span>
            <Clock className="w-4 h-4 text-aurora-violet" />
          </div>
          <span className="text-lg font-bold text-aurora-ink block">14 Days Avg Fill</span>
          <span className="text-xs text-aurora-violet font-bold">Ultra High Velocity</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Global Remote Share</span>
            <Globe className="w-4 h-4 text-aurora-indigo" />
          </div>
          <span className="text-lg font-bold text-aurora-ink block">52% Remote Roles</span>
          <span className="text-xs text-aurora-violet font-bold">Worldwide Hiring</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Market Opportunity Index</span>
            <Zap className="w-4 h-4 text-emerald-700 fill-emerald-400" />
          </div>
          <span className="text-lg font-bold text-emerald-700 block tabular-nums">96.5 / 100</span>
          <span className="text-xs text-emerald-700 font-bold">Tier 1 Growth</span>
        </GlassPanel>
      </div>

      {/* TRENDING SKILLS BOARD & EMERGING TECH (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TRENDING SKILLS BOARD (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-700" />
              Highest Demand Trending Technical Skills
            </span>

            {/* Category Filter Dropdown */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1 px-2.5 rounded-lg bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all" className="bg-aurora-canvas text-aurora-ink">All Categories</option>
              <option value="AI Frameworks" className="bg-aurora-canvas text-aurora-ink">AI Frameworks</option>
              <option value="Programming Languages" className="bg-aurora-canvas text-aurora-ink">Programming Languages</option>
              <option value="DevOps" className="bg-aurora-canvas text-aurora-ink">DevOps</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredSkills.map((skill, idx) => {
              const isTracked = trackedSkillNames.includes(skill.name);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isTracked ? 'bg-indigo-600/10 border-aurora-violet/25' : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-aurora-ink">{skill.name}</span>
                      <span className="px-2 py-0.2 rounded bg-aurora-violet/[0.06] text-aurora-indigo text-[9px] font-bold">
                        {skill.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-aurora-muted">
                      <span>Demand Score: <strong className="text-aurora-violet">{skill.demandScore}</strong></span>
                      <span>•</span>
                      <span>Priority: <strong className="text-emerald-700">{skill.priority}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      +{skill.growthYoY}% YoY
                    </span>

                    <button
                      onClick={() => toggleTrackSkill(skill.name)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isTracked
                          ? 'text-aurora-violet bg-aurora-violet/[0.06] border border-aurora-violet/25'
                          : 'text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas'
                      }`}
                      aria-label="Track skill"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* EMERGING TECH & DECLINING SKILLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* EMERGING TECH PANEL */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-aurora-violet" />
                Emerging Technology Forecast
              </span>
              <span className="text-[10px] text-aurora-violet font-bold bg-aurora-violet/[0.06] px-2 py-0.5 rounded">
                Early Adopter Stage
              </span>
            </div>

            <div className="space-y-2.5">
              {emergingTech.map((tech, i) => (
                <div key={i} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-aurora-ink block">{tech.name}</span>
                    <span className="text-[10px] text-aurora-muted">{tech.stage}</span>
                  </div>
                  <span className="font-bold text-aurora-violet bg-aurora-violet/[0.06] px-2 py-0.5 rounded">
                    3yr: {tech.growth3yr}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* DECLINING SKILLS PANEL */}
          <GlassPanel className="p-6 space-y-4 border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                Declining Skill Risk Vectors
              </span>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                High Pivot Urgency
              </span>
            </div>

            <div className="space-y-2.5">
              {decliningSkills.map((sk, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-aurora-ink">{sk.name}</span>
                    <span className="font-bold text-rose-700">{sk.declineYoY}</span>
                  </div>
                  <span className="text-[10px] text-aurora-muted block tabular-nums">
                    Recommended Pivot: <strong className="text-aurora-violet">{sk.pivot}</strong>
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* SECTION 4 — VISUALIZATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FUTURE FORECAST TIMELINE CHART (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-aurora-indigo" />
              Multi-Domain Hiring Demand Forecast Timeline
            </span>
            <span className="text-[10px] text-aurora-muted">2024 - 2025 Projection</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6eaf6', color: '#10153b', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="aiDemand" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#aiGrad)" name="AI & ML Frameworks" />
                <Area type="monotone" dataKey="cloudDemand" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#cloudGrad)" name="Cloud & DevOps" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* TECHNOLOGY LIFECYCLE STAGE CHART (5 COLS) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Cpu className="w-4 h-4 text-aurora-violet" />
              Technology Lifecycle Adoption Curve
            </span>
            <span className="text-[10px] text-aurora-muted">Distribution</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6eaf6', color: '#10153b', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val, _name, item) => [val, (item.payload as { label?: string } | undefined)?.label ?? '']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {lifecycleData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 1 ? '#6366f1' : index === 2 ? '#06b6d4' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      {/* REGIONAL OPPORTUNITIES & INDUSTRY HEALTH (2 COLS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REGIONAL OPPORTUNITY MAP */}
        <GlassPanel className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Globe className="w-4 h-4 text-aurora-violet" />
              Regional Tech Hub Opportunity Index
            </span>
            <span className="text-[10px] text-aurora-muted">Geographic Map</span>
          </div>

          <div className="space-y-2.5">
            {regionalDemands.map((reg, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-aurora-ink block">{reg.region}</span>
                  <span className="text-[10px] text-aurora-muted">Focus: {reg.focus}</span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="font-bold text-aurora-violet block">{reg.index} Index</span>
                  <span className="text-[10px] text-aurora-muted">{reg.remote} Remote</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* INDUSTRY HEALTH PANEL */}
        <GlassPanel className="p-6 space-y-4 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Industrial Sector Hiring Health Metrics
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">Live Index</span>
          </div>

          <div className="space-y-2.5">
            {industryHealthData.map((ind, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-aurora-ink block">{ind.industry}</span>
                  <span className="text-[10px] text-aurora-muted">Velocity: {ind.velocity}</span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="font-bold text-emerald-700 block">{ind.growthYoY} YoY</span>
                  <span className="text-[10px] text-aurora-muted">Health: {ind.healthScore}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* TRACKED SKILLS SUMMARY */}
      {trackedSkillNames.length > 0 && (
        <GlassPanel className="p-4 space-y-3 border-aurora-violet/25">
          <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
            <Compass className="w-4 h-4 text-aurora-indigo" />
            Tracked Market Skill Watchlist ({trackedSkillNames.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {trackedSkillNames.map((name, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-aurora-canvas border border-aurora-violet/25 text-xs text-aurora-indigo flex items-center gap-2">
                <span>★ {name}</span>
                <button onClick={() => toggleTrackSkill(name)} className="hover:text-aurora-indigo cursor-pointer text-[10px]">✕</button>
              </span>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
