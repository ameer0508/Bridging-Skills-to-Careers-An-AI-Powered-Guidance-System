import React, { useState, useMemo } from 'react';
import {
  Globe,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Code2,
  Palette,
  Eye,
  Server,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export interface ShowcaseProject {
  title: string;
  category: string;
  techStack: string[];
  liveDemoUrl: string;
  githubUrl: string;
  hasCaseStudy: boolean;
}

export interface SkillEvidenceRecord {
  skill: string;
  verified: boolean;
  confidenceScore: number;
  evidenceProjects: string[];
  evidenceStatus: string;
}

export const PortfolioIntelligenceWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [portfolioUrl, setPortfolioUrl] = useState<string>('https://alexmercer.dev');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>('Vector Search RAG Engine');

  // Simulated Datasets
  const showcaseProjects: ShowcaseProject[] = useMemo(
    () => [
      {
        title: 'Vector Search RAG Engine',
        category: 'AI / Distributed Systems',
        techStack: ['Python', 'FastAPI', 'Milvus', 'Docker'],
        liveDemoUrl: 'https://rag-demo.alexmercer.dev',
        githubUrl: 'https://github.com/octocat/vector-search-engine',
        hasCaseStudy: true,
      },
      {
        title: 'SkillBridge AI Platform',
        category: 'Web Applications / AI',
        techStack: ['React', 'TypeScript', 'TailwindCSS', 'Next.js'],
        liveDemoUrl: 'https://skillbridge.dev',
        githubUrl: 'https://github.com/octocat/react-career-intelligence',
        hasCaseStudy: true,
      },
    ],
    []
  );

  const verifiedSkills: SkillEvidenceRecord[] = useMemo(
    () => [
      {
        skill: 'Python',
        verified: true,
        confidenceScore: 98.0,
        evidenceProjects: ['Vector Search RAG Engine'],
        evidenceStatus: 'Live Showcase Verified',
      },
      {
        skill: 'React',
        verified: true,
        confidenceScore: 98.0,
        evidenceProjects: ['SkillBridge AI Platform'],
        evidenceStatus: 'Live Showcase Verified',
      },
      {
        skill: 'Docker',
        verified: true,
        confidenceScore: 98.0,
        evidenceProjects: ['Vector Search RAG Engine'],
        evidenceStatus: 'Live Showcase Verified',
      },
      {
        skill: 'FastAPI',
        verified: true,
        confidenceScore: 95.0,
        evidenceProjects: ['Vector Search RAG Engine'],
        evidenceStatus: 'Live Showcase Verified',
      },
    ],
    []
  );

  const handleAnalyzePortfolio = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Crawling portfolio DOM, UI/UX aesthetics, & live project showcases for [${portfolioUrl}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Analyzed Portfolio Website! Portfolio Score 95.0/100 (Top 1% Enterprise Portfolio)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Portfolio Intelligence & Project Verification"
        subtitle="EVALUATE REAL ENGINEERING CAPABILITY, DESIGN MATURITY, UI/UX AESTHETICS, & LIVE PROJECT SHOWCASES"
        badge="Portfolio Intelligence"
        badgeColor="indigo"
        metrics={[
          { label: 'Overall Portfolio Score', value: '95.0 / 100', change: 'Top 1% Portfolio', trend: 'up' },
          { label: 'UI/UX Maturity', value: '96.5 / 100', change: 'Glassmorphism Aesthetic', trend: 'up' },
          { label: 'Architecture Score', value: '95.0 / 100', change: 'RAG + Microservices', trend: 'up' },
          { label: 'Accessibility & WCAG', value: '94.0%', change: 'AA Compliant', trend: 'up' },
        ]}
      />

      {/* TOP URL INPUT & SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Globe className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="Enter portfolio URL (e.g. https://alexmercer.dev)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleAnalyzePortfolio}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Crawling Website...' : 'Analyze Portfolio Website'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* METRIC GRID (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">UI/UX & Aesthetics</span>
            <Palette className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">96.5 / 100</span>
          <span className="text-xs font-mono text-indigo-300">Glassmorphism UI</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">System Architecture</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">95.0 / 100</span>
          <span className="text-xs font-mono text-emerald-300">RAG + Microservices</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Deployment & Hosting</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">98.0 / 100</span>
          <span className="text-xs font-mono text-cyan-300">Vercel / Cloudflare CDN</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Accessibility WCAG</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">94.0 / 100</span>
          <span className="text-xs font-mono text-purple-300">AA Compliant</span>
        </GlassPanel>
      </div>

      {/* SKILL EVIDENCE & PROJECT SHOWCASE (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIVE SHOWCASE EVIDENCE (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Showcase Skill Evidence Verification
              </span>
            </div>

            <div className="space-y-3">
              {verifiedSkills.map((sk) => (
                <div key={sk.skill} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">{sk.skill}</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">
                      {sk.confidenceScore}% Confidence
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 font-mono text-[11px] text-slate-400">
                    <div>Evidence Projects: <strong className="text-indigo-300">{sk.evidenceProjects.join(', ')}</strong></div>
                    <div>Status: <span className="text-emerald-400 font-bold">● {sk.evidenceStatus}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* SHOWCASE PROJECTS EXPLORER (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Extracted Project Showcases ({showcaseProjects.length})
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
              High Quality
            </span>
          </div>

          <div className="space-y-3">
            {showcaseProjects.map((proj) => {
              const isSelected = selectedProjectTitle === proj.title;
              return (
                <div
                  key={proj.title}
                  onClick={() => setSelectedProjectTitle(proj.title)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-950/70 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-mono">{proj.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[10px] font-bold border border-white/10">
                      {proj.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {proj.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                    <a
                      href={proj.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" /> GitHub Source
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={95.0}
        lastUpdated="Portfolio Intelligence Live"
      />
    </div>
  );
};

export default PortfolioIntelligenceWorkspace;
