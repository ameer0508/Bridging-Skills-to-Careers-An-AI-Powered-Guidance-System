import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Globe,
  Award,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
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
  const [selectedCountry, setSelectedCountry] = useState<string>('United States');
  const [trackedSkillNames, setTrackedSkillNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sb-tracked-skills');
    return saved ? JSON.parse(saved) : ['Vector Indexing (Milvus/Pinecone)', 'LangChain & LlamaIndex'];
  });
  const [savedReports, setSavedReports] = useState<string[]>([]);

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
  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return trendingSkills;
    return trendingSkills.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, trendingSkills]);

  return (
    <div className="space-y-8">
      {/* HEADER & TOP CONTROLS */}
      <GlassPanel className="p-6 space-y-4 border-indigo-500/30 bg-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Global Market Trends & Emerging Technology Engine
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                8 Data Adapters Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuous labor market analytics tracking technology velocity, hiring demand, and 3-year adoption forecasts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveReport}
              className="py-2 px-3.5 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Market Report</span>
            </button>
            {onExploreRoadmap && (
              <button
                onClick={onExploreRoadmap}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View Learning Roadmap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI INSIGHT CARD */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">
              AI Market Velocity Synthesis (Q3 2024 Index)
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">Vector Indexing (Milvus)</strong> and <strong className="text-cyan-300">LangChain</strong> lead market demand with <strong className="text-emerald-400">+42% YoY hiring growth</strong> across San Francisco, NYC, and Global Remote markets (<strong className="text-emerald-400">98.4% Confidence</strong>).
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Top Demand Skill</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-lg font-bold text-white block truncate">LangChain & LLMs</span>
          <span className="text-xs font-mono text-emerald-400 font-bold">+42.0% YoY Growth</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Hiring Urgency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-lg font-bold text-white block">14 Days Avg Fill</span>
          <span className="text-xs font-mono text-cyan-300 font-bold">Ultra High Velocity</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Global Remote Share</span>
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-lg font-bold text-white block">52% Remote Roles</span>
          <span className="text-xs font-mono text-purple-300 font-bold">Worldwide Hiring</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Market Opportunity Index</span>
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <span className="text-lg font-bold text-emerald-400 block font-mono">96.5 / 100</span>
          <span className="text-xs font-mono text-emerald-300 font-bold">Tier 1 Growth</span>
        </GlassPanel>
      </div>

      {/* TRENDING SKILLS BOARD & EMERGING TECH (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TRENDING SKILLS BOARD (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Highest Demand Trending Technical Skills
            </span>

            {/* Category Filter Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1 px-2.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Categories</option>
              <option value="AI Frameworks" className="bg-slate-900 text-white">AI Frameworks</option>
              <option value="Programming Languages" className="bg-slate-900 text-white">Programming Languages</option>
              <option value="DevOps" className="bg-slate-900 text-white">DevOps</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredSkills.map((skill, idx) => {
              const isTracked = trackedSkillNames.includes(skill.name);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isTracked ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{skill.name}</span>
                      <span className="px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">
                        {skill.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span>Demand Score: <strong className="text-cyan-300">{skill.demandScore}</strong></span>
                      <span>•</span>
                      <span>Priority: <strong className="text-emerald-400">{skill.priority}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      +{skill.growthYoY}% YoY
                    </span>

                    <button
                      onClick={() => toggleTrackSkill(skill.name)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isTracked
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
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
          <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Emerging Technology Forecast
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                Early Adopter Stage
              </span>
            </div>

            <div className="space-y-2.5">
              {emergingTech.map((tech, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{tech.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{tech.stage}</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                    3yr: {tech.growth3yr}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* DECLINING SKILLS PANEL */}
          <GlassPanel className="p-6 space-y-4 border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Declining Skill Risk Vectors
              </span>
              <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                High Pivot Urgency
              </span>
            </div>

            <div className="space-y-2.5">
              {decliningSkills.map((sk, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{sk.name}</span>
                    <span className="font-mono font-bold text-rose-400">{sk.declineYoY}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Recommended Pivot: <strong className="text-cyan-300">{sk.pivot}</strong>
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
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Multi-Domain Hiring Demand Forecast Timeline
            </span>
            <span className="text-[10px] font-mono text-slate-400">2024 - 2025 Projection</span>
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
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
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Technology Lifecycle Adoption Curve
            </span>
            <span className="text-[10px] font-mono text-slate-400">Distribution</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any, name: any, item: any) => [val, item.payload.label]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {lifecycleData.map((entry, index) => (
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
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Regional Tech Hub Opportunity Index
            </span>
            <span className="text-[10px] font-mono text-slate-400">Geographic Map</span>
          </div>

          <div className="space-y-2.5">
            {regionalDemands.map((reg, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{reg.region}</span>
                  <span className="text-[10px] font-mono text-slate-400">Focus: {reg.focus}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-cyan-300 block">{reg.index} Index</span>
                  <span className="text-[10px] text-slate-400">{reg.remote} Remote</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* INDUSTRY HEALTH PANEL */}
        <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Industrial Sector Hiring Health Metrics
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Live Index</span>
          </div>

          <div className="space-y-2.5">
            {industryHealthData.map((ind, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{ind.industry}</span>
                  <span className="text-[10px] font-mono text-slate-400">Velocity: {ind.velocity}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-emerald-400 block">{ind.growthYoY} YoY</span>
                  <span className="text-[10px] text-slate-400">Health: {ind.healthScore}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* TRACKED SKILLS SUMMARY */}
      {trackedSkillNames.length > 0 && (
        <GlassPanel className="p-4 space-y-3 border-indigo-500/30">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            Tracked Market Skill Watchlist ({trackedSkillNames.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {trackedSkillNames.map((name, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-slate-950 border border-indigo-500/40 text-xs font-mono text-indigo-300 flex items-center gap-2">
                <span>★ {name}</span>
                <button onClick={() => toggleTrackSkill(name)} className="hover:text-white cursor-pointer text-[10px]">✕</button>
              </span>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
