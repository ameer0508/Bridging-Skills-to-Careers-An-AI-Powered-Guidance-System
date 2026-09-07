import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Cpu,
  Trophy,
  CheckCircle2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export interface PlatformProfile {
  platform: string;
  username: string;
  totalSolved: number;
  rating?: number | string;
  rank?: string;
  badge: string;
}

export const CodingIntelligenceWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [username, setUsername] = useState<string>('tourist');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Simulated Datasets
  const platformProfiles: PlatformProfile[] = useMemo(
    () => [
      {
        platform: 'LeetCode',
        username: username,
        totalSolved: 540,
        rating: 1980,
        rank: 'Top 3.5%',
        badge: 'Guardian',
      },
      {
        platform: 'Codeforces',
        username: username,
        totalSolved: 320,
        rating: 1850,
        rank: 'Candidate Master',
        badge: 'Master',
      },
      {
        platform: 'CodeChef',
        username: username,
        totalSolved: 210,
        rating: 2040,
        rank: '5 Stars',
        badge: '5 Stars',
      },
      {
        platform: 'HackerRank',
        username: username,
        totalSolved: 180,
        rank: '6 Stars',
        badge: 'Problem Solving',
      },
    ],
    [username]
  );

  const topicStrengths = [
    { topic: 'Dynamic Programming', score: 98, level: 'Master' },
    { topic: 'Graph Theory & BFS/DFS', score: 95, level: 'Master' },
    { topic: 'Trees & Binary Search Trees', score: 96, level: 'Master' },
    { topic: 'Backtracking & Recursion', score: 92, level: 'Advanced' },
    { topic: 'Segment Trees & Fenwick Trees', score: 65, level: 'Learning Priority' },
  ];

  const handleAnalyzeProfile = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Fetching competitive coding stats across LeetCode, Codeforces, & HackerRank for [${username}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Analyzed @${username}! FAANG Interview Readiness 98.5% (L5/L6 Senior Ready)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Coding Platform Intelligence & DSA Assessment"
        subtitle="MEASURE ALGORITHMIC PROBLEM-SOLVING ABILITY, FAANG INTERVIEW READINESS, & COMPETITIVE CODING GROWTH"
        badge="Coding Intelligence"
        badgeColor="indigo"
        metrics={[
          { label: 'FAANG Interview Readiness', value: '98.5 / 100', change: 'L5/L6 Senior Ready', trend: 'up' },
          { label: 'Total Problems Solved', value: '1,250 Solved', change: '80 Hard Problems', trend: 'up' },
          { label: 'LeetCode Contest Rating', value: '1980 Rating', change: 'Top 3.5% Global', trend: 'up' },
          { label: 'DSA Topic Coverage', value: '95.0%', change: 'Master Tier', trend: 'up' },
        ]}
      />

      {/* TOP USERNAME SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Terminal className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter competitive coding handle..."
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
            <span>{isAnalyzing ? 'Aggregating Platforms...' : 'Analyze Coding Profile'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* PLATFORM CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformProfiles.map((pf) => (
          <GlassPanel key={pf.platform} className="p-4 space-y-3 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">{pf.platform}</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                {pf.badge}
              </span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div>Solved: <strong className="text-white font-bold">{pf.totalSolved} Problems</strong></div>
              {pf.rating && <div>Rating: <span className="text-cyan-400 font-bold">{pf.rating}</span></div>}
              {pf.rank && <div className="text-[10px] text-slate-400">Rank: {pf.rank}</div>}
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* DIFFICULTY BREAKDOWN & TOPIC HEATMAP (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DIFFICULTY BREAKDOWN (5 COLS) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Problem Difficulty Distribution
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Balanced Mix
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Easy Problems</span>
                <span>180 Solved</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-emerald-500 w-[35%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Medium Problems</span>
                <span>280 Solved</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-amber-500 w-[55%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-rose-400 font-bold">
                <span>Hard Problems</span>
                <span>80 Solved</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-rose-500 w-[20%]" />
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* TOPIC MASTERY BREAKDOWN (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Algorithmic & Data Structures Topic Mastery
            </span>
          </div>

          <div className="space-y-3">
            {topicStrengths.map((tp) => (
              <div key={tp.topic} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${tp.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-white font-bold">{tp.topic}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                  tp.score >= 90
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {tp.score}% ({tp.level})
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.5}
        lastUpdated="Coding Intelligence Live"
      />
    </div>
  );
};

export default CodingIntelligenceWorkspace;
