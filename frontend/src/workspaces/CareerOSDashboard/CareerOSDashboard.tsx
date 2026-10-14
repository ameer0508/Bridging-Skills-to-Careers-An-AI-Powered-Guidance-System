import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  Users,
  Brain,
  Workflow,
  CheckCircle2,
  Send,
  Building,
  GraduationCap,
  Command,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const CareerOSDashboard: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // State Management
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [, setIsCommandPaletteOpen] = useState(false);

  // Simulated Unified CareerOS Payload
  const careerOSMetrics = useMemo(
    () => ({
      briefing: {
        greeting: 'Good Morning Alex!',
        readinessScore: 96.5,
        summary:
          'Today you have 1 priority interview prep session, 3 high-match job opportunities (OpenScale AI Systems #1), and 1 Stanford Alumni referral path ready.',
      },
      health: {
        score: 96.5,
        targetRole: 'Principal AI Infrastructure Architect',
        targetSalary: '$240,000 USD',
        forecast: 'On track for 94% interview callback probability upon outreach authorization.',
      },
      priorities: [
        { id: 'p_01', title: 'Complete Milvus Vector Indexing Lab Block', urgency: 'HIGH', agent: 'Learning Agent' },
        { id: 'p_02', title: 'Authorize Outreach to Dr. Sarah Chen', urgency: 'MEDIUM', agent: 'Networking Agent' },
      ],
      agents: [
        { id: 'career_agent', name: 'Career Planning Agent', action: 'Defined 2026 Milestone Roadmap', time: '10m ago' },
        { id: 'learning_agent', name: 'Learning Agent', action: 'Scheduled Milvus Lab Block', time: '25m ago' },
        { id: 'resume_agent', name: 'Resume Optimization Agent', action: 'Optimized ATS Score to 96.5%', time: '1h ago' },
        { id: 'interview_agent', name: 'Interview Agent', action: 'System Design Mock Ready (94% Fit)', time: '2h ago' },
        { id: 'job_agent', name: 'Job Search Agent', action: 'Matched OpenScale AI Systems (#1 Match)', time: '3h ago' },
        { id: 'networking_agent', name: 'Networking Agent', action: 'Discovered Stanford Alumni Path', time: '4h ago' },
        { id: 'opportunity_agent', name: 'Opportunity Agent', action: 'Discovered OpenScale $150k Fellowship', time: '5h ago' },
      ],
      opportunities: [
        { title: 'Principal AI Infrastructure Architect', company: 'OpenScale AI Systems', salary: '$240k - $260k', match: 98.2 },
        { title: 'Senior AI Infrastructure & Vector Systems Fellowship', company: 'OpenScale Research Labs', salary: '$150,000 Grant', match: 98.5 },
      ],
      actions: [
        { id: 'act_01', type: 'HUMAN_APPROVAL', title: 'Authorize InMail Outreach Draft to Dr. Sarah Chen', route: '/networking-agent' },
        { id: 'act_02', type: 'STUDY_BLOCK', title: 'Complete Vector Indexing Mastery Quiz', route: '/learning-agent' },
      ],
      reasoning:
        'CareerOS has synchronized all 7 Autonomous AI Agents to maximize your transition velocity toward Principal AI Infrastructure Architect ($240,000 USD salary level) with 98.2% composite confidence.',
    }),
    []
  );

  const filteredAgentActivities = useMemo(() => {
    if (selectedAgent === 'ALL') return careerOSMetrics.agents;
    return careerOSMetrics.agents.filter((a) => a.id === selectedAgent);
  }, [selectedAgent, careerOSMetrics]);

  const handleActionClick = (route: string, title: string) => {
    addToast({
      type: 'info',
      message: `Navigating to action: ${title}...`,
    });
    navigate(route);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO & COMMAND PALETTE TRIGGER */}
      <div className="relative">
        <WorkspaceHero
          title="SkillBridge CareerOS AI Command Center"
          subtitle="UNIFIED AUTONOMOUS OPERATING SYSTEM SURFACING ALL 7 AI AGENTS & INTELLIGENCE MODULES"
          badge="CareerOS v1.0"
          badgeColor="indigo"
          metrics={[
            { label: 'Career Health Score', value: '96.5 / 100', change: 'Top 3% Candidate', trend: 'up' },
            { label: 'Readiness Index', value: '96.5%', change: '94% Callback Probability', trend: 'up' },
            { label: 'Active AI Agents', value: '7 / 7 Synchronized', change: 'Multi-Agent DAG Active', trend: 'up' },
            { label: 'Target Compensation', value: '$240,000 USD', change: 'Level Achievable', trend: 'up' },
          ]}
        />

        <button
          onClick={() => {
            setIsCommandPaletteOpen(true);
            addToast({ message: 'Command Palette triggered (Ctrl + K)', type: 'info' });
          }}
          className="absolute top-4 right-4 py-2 px-4 rounded-xl bg-violet-50 hover:bg-violet-50 border border-aurora-violet/25 text-xs font-bold text-aurora-indigo flex items-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <Command className="w-4 h-4" /> Quick Command (Ctrl + K)
        </button>
      </div>

      {/* MORNING AI BRIEFING BENTO HERO */}
      <GlassPanel className="p-6 space-y-4 border-aurora-violet/25 relative overflow-hidden bg-gradient-to-r from-white via-aurora-sidebar to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-aurora-ink tracking-wide">{careerOSMetrics.briefing.greeting}</h2>
              <span className="text-xs text-aurora-indigo">Daily Morning AI Briefing • 96.5% Candidate Readiness</span>
            </div>
          </div>

          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> All 7 Agents Synchronized
          </span>
        </div>

        <p className="text-aurora-muted text-xs leading-relaxed pl-1 border-l-2 border-aurora-violet/25">
          {careerOSMetrics.briefing.summary}
        </p>
      </GlassPanel>

      {/* BENTO GRID (CAREER HEALTH, ACTION CENTER, TOP PRIORITIES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ACTION CENTER & HUMAN APPROVALS (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Zap className="w-4 h-4 text-aurora-violet" />
              Action Center & Human-in-the-Loop Approvals ({careerOSMetrics.actions.length})
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {careerOSMetrics.actions.map((act) => (
              <div
                key={act.id}
                onClick={() => handleActionClick(act.route, act.title)}
                className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-violet/25 transition-all cursor-pointer space-y-2 flex items-center justify-between group"
              >
                <div>
                  <span className="font-bold text-aurora-ink text-sm block group-hover:text-aurora-violet transition-colors">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-aurora-muted">Type: <strong className="text-aurora-violet">{act.type}</strong></span>
                </div>

                <span className="py-1.5 px-3 rounded-xl bg-cyan-50 text-aurora-violet font-bold text-[11px] group-hover:bg-sky-100 group-hover:text-aurora-indigo transition-all flex items-center gap-1">
                  <Send className="w-3 h-3" /> Review Action
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* TODAY'S AI PRIORITIES (5 COLS) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Award className="w-4 h-4 text-aurora-violet" />
              Today's AI Priorities
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {careerOSMetrics.priorities.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-aurora-ink text-[11px]">{p.title}</span>
                  <span className="text-[10px] bg-purple-500/10 text-aurora-violet font-bold px-2 py-0.5 rounded">
                    {p.urgency}
                  </span>
                </div>
                <span className="text-[10px] text-aurora-muted block">Agent: {p.agent}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* MULTI-AGENT ACTIVITY STREAM & TOP OPPORTUNITIES (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MULTI-AGENT ACTIVITY STREAM (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Workflow className="w-4 h-4 text-aurora-indigo" />
              Real-Time Multi-Agent Activity Stream
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs">
              {['ALL', 'career_agent', 'job_agent', 'networking_agent'].map((ag) => (
                <button
                  key={ag}
                  onClick={() => setSelectedAgent(ag)}
                  className={`py-0.5 px-2 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAgent === ag ? 'text-white [background:var(--aurora-gradient-action)]' : 'bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo'
                  }`}
                >
                  {ag === 'ALL' ? 'ALL' : ag.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto pr-1" role="region" aria-label="Agent activity" tabIndex={0}>
            {filteredAgentActivities.map((a) => (
              <div key={a.name} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-aurora-indigo block">{a.name}</span>
                  <span className="text-aurora-muted">{a.action}</span>
                </div>
                <span className="text-[10px] text-aurora-muted shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* TOP OPPORTUNITIES & FELLOWSHIPS (5 COLS) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              Surfaced Opportunities
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {careerOSMetrics.opportunities.map((op) => (
              <div key={op.title} className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-aurora-ink text-[11px]">{op.title}</span>
                  <span className="text-emerald-700 font-bold text-[10px]">★ {op.match}% Match</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-aurora-muted">
                  <span>{op.company}</span>
                  <span className="text-emerald-700 font-bold">{op.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* QUICK JUMP WORKSPACE NAVIGATOR BENTO */}
      <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
        <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
          <Brain className="w-4 h-4 text-aurora-indigo" />
          Quick Workspace Jump Navigator
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            { label: 'Career Agent', route: '/agent', icon: TrendingUp },
            { label: 'Job Search', route: '/job-agent', icon: Briefcase },
            { label: 'Learning Agent', route: '/learning-agent', icon: BookOpen },
            { label: 'Resume Agent', route: '/resume-agent', icon: Award },
            { label: 'Interview Agent', route: '/interview-agent', icon: GraduationCap },
            { label: 'Networking', route: '/networking-agent', icon: Users },
            { label: 'Opportunity', route: '/opportunity-agent', icon: Building },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-violet/25 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
              >
                <IconComp className="w-5 h-5 text-aurora-indigo group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-aurora-ink group-hover:text-aurora-indigo transition-colors">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.2}
        lastUpdated="SkillBridge CareerOS Active"
      />
    </div>
  );
};

export default CareerOSDashboard;
