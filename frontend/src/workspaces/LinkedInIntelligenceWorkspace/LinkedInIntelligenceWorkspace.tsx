import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Briefcase,
  Search,
  RefreshCw,
  Copy,
  Check,
  Star,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const LinkedInIntelligenceWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [profileId, setProfileId] = useState<string>('usr-linkedin-101');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [copiedHeadline, setCopiedHeadline] = useState<boolean>(false);

  // Simulated Datasets
  const profileSummary = useMemo(
    () => ({
      headline: 'Senior AI Infrastructure Engineer & Distributed Systems Architect',
      summary: 'Passionate software architect specializing in high-throughput vector search, microservices, and AI platform engineering.',
      connections: 850,
      profileStrength: 96.9,
      recruiterAppeal: 94.9,
      atsCompatibility: 96.0,
      totalExperienceYears: 5.0,
      suggestedHeadline: 'Senior AI Platform Architect | Distributed Systems & High-Throughput Vector DB Specialist',
      suggestedKeywords: ['Vector Indexing', 'RAG Architecture', 'FastAPI Microservices', 'Kubernetes'],
    }),
    []
  );

  const experiences = [
    {
      title: 'Senior AI Infrastructure Engineer',
      company: 'TechCorp AI',
      duration: '2 Years (2024 - Present)',
      description: 'Architected vector search microservices with FastAPI, Docker, and Kubernetes.',
      isCurrent: true,
    },
    {
      title: 'Software Engineer',
      company: 'CloudSystems Inc',
      duration: '3 Years (2021 - 2024)',
      description: 'Developed distributed backend services and REST APIs in Python and Go.',
      isCurrent: false,
    },
  ];

  const topEndorsedSkills = [
    { name: 'Python', endorsements: 42 },
    { name: 'FastAPI', endorsements: 28 },
    { name: 'Kubernetes', endorsements: 35 },
    { name: 'Docker', endorsements: 38 },
  ];

  const handleAnalyzeProfile = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Fetching LinkedIn profile data & evaluating recruiter appeal for [${profileId}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Analyzed LinkedIn Profile! Profile Strength 96.9/100 (All-Star Status)`,
      });
    }, 1000);
  };

  const handleCopyHeadline = () => {
    navigator.clipboard.writeText(profileSummary.suggestedHeadline);
    setCopiedHeadline(true);
    addToast({
      type: 'success',
      message: 'Copied AI-optimized LinkedIn headline to clipboard!',
    });
    setTimeout(() => setCopiedHeadline(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge LinkedIn Professional Identity Intelligence"
        subtitle="EVALUATE PROFESSIONAL IDENTITY, RECRUITER APPEAL, BRANDING STRENGTH, & CAREER PROGRESSION"
        badge="LinkedIn Intelligence"
        badgeColor="indigo"
        metrics={[
          { label: 'Profile Strength', value: '96.9 / 100', change: 'All-Star Status', trend: 'up' },
          { label: 'Recruiter Appeal', value: '94.9%', change: 'High Visibility', trend: 'up' },
          { label: 'ATS Compatibility', value: '96.0%', change: 'Keyword Matched', trend: 'up' },
          { label: 'Networking Reach', value: '850 Connections', change: 'Top 5% Network', trend: 'up' },
        ]}
      />

      {/* TOP PROFILE INPUT BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Users className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Enter LinkedIn profile ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleAnalyzeProfile}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing LinkedIn Profile...' : 'Analyze LinkedIn Profile'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* AI BRANDING OPTIMIZATION BANNER */}
      <GlassPanel className="p-6 space-y-4 border-cyan-500/30 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              AI-Optimized Recruiter Headline Recommendation
            </span>
          </div>
          <button
            onClick={handleCopyHeadline}
            className="py-1.5 px-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedHeadline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHeadline ? 'Copied!' : 'Copy Headline'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-300 leading-relaxed">
          "{profileSummary.suggestedHeadline}"
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-slate-400 text-xs font-mono">Suggested Recruiter Keywords:</span>
          {profileSummary.suggestedKeywords.map((kw) => (
            <span key={kw} className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold shrink-0">
              +{kw}
            </span>
          ))}
        </div>
      </GlassPanel>

      {/* CAREER TIMELINE & ENDORSEMENTS (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CAREER PROGRESSION TIMELINE (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Verified Career Progression ({experiences.length} Roles)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Upward Trajectory
            </span>
          </div>

          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{exp.duration}</span>
                </div>
                <span className="text-indigo-300 font-mono text-[11px] block">{exp.company}</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* SKILL ENDORSEMENTS & NETWORK (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Peer Skill Endorsements
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {topEndorsedSkills.map((sk) => (
                <div key={sk.name} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span className="text-white font-bold">{sk.name}</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                    ★ {sk.endorsements} Endorsements
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={96.9}
        lastUpdated="LinkedIn Intelligence Live"
      />
    </div>
  );
};

export default LinkedInIntelligenceWorkspace;
