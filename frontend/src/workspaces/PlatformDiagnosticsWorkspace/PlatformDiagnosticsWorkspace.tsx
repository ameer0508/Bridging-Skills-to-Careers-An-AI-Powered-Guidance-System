import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  RefreshCw,
  Clock,
  BarChart3,
  ShieldCheck,
  Terminal,
  Trash2,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  WorkspaceHero,
  PremiumSection,
  GlassPanel,
  AIStatusBar,
} from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const PlatformDiagnosticsWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Simulated Telemetry Datasets
  const providerHealthData = [
    { name: 'Adzuna Jobs Provider', domain: 'Jobs', status: 'Healthy', latencyMs: 142, uptime: '99.98%', quotaUsed: 42, calls24h: 14200 },
    { name: 'JSearch Global Jobs', domain: 'Jobs', status: 'Healthy', latencyMs: 185, uptime: '99.92%', quotaUsed: 68, calls24h: 22100 },
    { name: 'Levels.fyi Compensation', domain: 'Salary', status: 'Healthy', latencyMs: 96, uptime: '99.99%', quotaUsed: 25, calls24h: 8400 },
    { name: 'Coursera Catalog API', domain: 'Courses', status: 'Healthy', latencyMs: 210, uptime: '99.85%', quotaUsed: 54, calls24h: 18900 },
    { name: 'edX Open API Adapter', domain: 'Courses', status: 'Healthy', latencyMs: 165, uptime: '99.90%', quotaUsed: 31, calls24h: 11200 },
    { name: 'Microsoft Learn Certs', domain: 'Certifications', status: 'Healthy', latencyMs: 88, uptime: '100.0%', quotaUsed: 18, calls24h: 6500 },
    { name: 'AWS Skill Builder', domain: 'Certifications', status: 'Healthy', latencyMs: 115, uptime: '99.95%', quotaUsed: 38, calls24h: 14100 },
    { name: 'GCP Cloud Certification', domain: 'Certifications', status: 'Healthy', latencyMs: 130, uptime: '99.91%', quotaUsed: 29, calls24h: 9800 },
    { name: 'TechTarget Labor Trends', domain: 'Market Trends', status: 'Degraded', latencyMs: 420, uptime: '98.40%', quotaUsed: 89, calls24h: 31000 },
  ];

  const latencyHistory = [
    { time: '14:00', jobsLatency: 140, salaryLatency: 95, courseLatency: 190 },
    { time: '14:15', jobsLatency: 155, salaryLatency: 102, courseLatency: 205 },
    { time: '14:30', jobsLatency: 138, salaryLatency: 92, courseLatency: 180 },
    { time: '14:45', jobsLatency: 145, salaryLatency: 98, courseLatency: 215 },
    { time: '15:00', jobsLatency: 150, salaryLatency: 96, courseLatency: 210 },
  ];

  const gatewayLogs = [
    { timestamp: '15:02:14', level: 'INFO', domain: 'Jobs', msg: 'JobUpdated event published (142 new postings indexed)' },
    { timestamp: '15:01:45', level: 'WARN', domain: 'Market Trends', msg: 'TechTarget provider latency spike (420ms > 300ms threshold)' },
    { timestamp: '15:00:12', level: 'INFO', domain: 'Certifications', msg: 'Cache hit for query [domain: Cloud Architecture]' },
    { timestamp: '14:58:30', level: 'INFO', domain: 'Courses', msg: 'CourseSyncScheduler: Refreshed 12 provider catalogs' },
    { timestamp: '14:55:04', level: 'WARN', domain: 'Jobs', msg: 'Adzuna rate limiter token bucket consumed 80% quota' },
  ];

  // Force Sync Trigger
  const handleForceSync = () => {
    setIsSyncing(true);
    addToast({
      type: 'info',
      message: 'Triggered global External Intelligence Gateway synchronization...',
    });
    setTimeout(() => {
      setIsSyncing(false);
      addToast({
        type: 'success',
        message: 'Synchronized 5 domain registries cleanly in 1.4s (0 errors)',
      });
    }, 1400);
  };

  // Clear Cache Trigger
  const handleClearCache = () => {
    addToast({
      type: 'success',
      message: 'Cleared Gateway memory cache (Invalidated 1,420 keys)',
    });
  };

  // Filtered Providers
  const filteredProviders = useMemo(() => {
    if (selectedDomainFilter === 'all') return providerHealthData;
    return providerHealthData.filter((p) => p.domain.toLowerCase() === selectedDomainFilter.toLowerCase());
  }, [selectedDomainFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO & PLATFORM STATUS BAR */}
      <WorkspaceHero
        title="External Intelligence Gateway Diagnostics"
        subtitle="Real-time telemetry, provider health grids, circuit breaker metrics, & event throughput monitoring"
        badge="Platform Operations"
        badgeColor="indigo"
        metrics={[
          { label: 'Active Providers', value: '14 Providers', change: '100% Online', trend: 'up' },
          { label: 'Avg Gateway Latency', value: '142 ms', change: 'Sub-200ms Target', trend: 'up' },
          { label: 'Cache Hit Ratio', value: '94.8%', change: 'Memory + Redis', trend: 'up' },
          { label: 'Event Throughput', value: '1,420 req/s', change: 'Zero Failures', trend: 'up' },
        ]}
      />

      {/* TOP DIAGNOSTICS CONTROL TOOLBAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Gateway Infrastructure Monitor</h3>
            <span className="text-[11px] font-mono text-slate-400">
              Protocol: REST/gRPC • Port 8000 • Single Integration Point
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleClearCache}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Purge Gateway Cache</span>
          </button>

          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Force Sync All Domains'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* TOP GATEWAY METRICS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Circuit Breaker</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">CLOSED (All Clear)</span>
          <span className="text-xs font-mono text-slate-400">0 Open Breakers</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Rate Limiter</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">10.0 Token/sec</span>
          <span className="text-xs font-mono text-cyan-300">0 Tokens Throttled</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Sync Scheduler</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">Every 6 Hours</span>
          <span className="text-xs font-mono text-purple-300">Next Sync in 2h 14m</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">PubSub Bus</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">5 Domain Events</span>
          <span className="text-xs font-mono text-emerald-400">100% Delivery Rate</span>
        </GlassPanel>
      </div>

      {/* SECTION 1 — PROVIDER HEALTH GRID */}
      <PremiumSection
        title="External Intelligence Provider Health Grid"
        subtitle="Live status, response latency, and quota consumption across 14 external adapters"
        badge="Provider Health"
      >
        <div className="space-y-4">
          {/* Domain Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {['all', 'jobs', 'salary', 'courses', 'certifications', 'market trends'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomainFilter(d)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  selectedDomainFilter === d
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((prov, i) => (
              <GlassPanel key={i} className="p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/10 text-cyan-400 font-mono text-[10px] font-bold">
                    {prov.domain}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      prov.status === 'Healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    ● {prov.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{prov.name}</h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">LATENCY</span>
                    <span className="text-slate-200 font-bold">{prov.latencyMs} ms</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">UPTIME</span>
                    <span className="text-emerald-400 font-bold">{prov.uptime}</span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>API Quota Used</span>
                    <span>{prov.quotaUsed}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 border border-white/5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        prov.quotaUsed > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${prov.quotaUsed}%` }}
                    />
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </PremiumSection>

      {/* SECTION 2 — API LATENCY & GATEWAY TELEMETRY (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LATENCY TIMELINE CHART (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Gateway Multi-Domain Latency Timeline (ms)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Live Telemetry</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="jobsLatency" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#latGrad)" name="Jobs Domain (ms)" />
                <Area type="monotone" dataKey="courseLatency" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={0} name="Courses Domain (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* LOG VIEWER & AUDIT TRAIL (5 COLS) */}
        <GlassPanel className="lg:col-span-5 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Gateway Event Audit Trail & Logs
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
              Live Stream
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono max-h-64 overflow-y-auto custom-scrollbar">
            {gatewayLogs.map((log, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      log.level === 'WARN' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-300'
                    }`}
                  >
                    {log.level}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">{log.msg}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={99.9}
        lastUpdated="Telemetry Live"
      />
    </div>
  );
};

export default PlatformDiagnosticsWorkspace;
