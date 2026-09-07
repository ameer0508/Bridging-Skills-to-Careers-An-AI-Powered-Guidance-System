import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/axios';
import { AIStatusBar } from '../../../components/experience/workspace';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { WhatIfSimulator } from './WhatIfSimulator';
import { ForecastCards } from './ForecastCards';
import { SalaryProjectionPanel } from './SalaryProjectionPanel';
import { ExecutiveInsightsPanel } from './ExecutiveInsightsPanel';
import { MarketIntelligencePanel } from './MarketIntelligencePanel';

export const AnalyticsDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics?period=${period}`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium">
        Failed to load analytics. {(error as Error).message}
      </div>
    );
  }

  const { currentMetrics, trends, insights, recentEvents, historicalSnapshots } = analyticsData;

  // Format chart data
  const chartData = historicalSnapshots.map((s: { date: string | number | Date; averageReadinessScore: number; totalSkills: number }) => ({
    date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    readiness: s.averageReadinessScore,
    skills: s.totalSkills
  }));

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Predictive Analytics & Career Intelligence Center</h1>
          <p className="text-slate-400 text-sm">Forecast career growth trajectories, simulate "What-If" scenarios, and inspect AI executive insights.</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* EXECUTIVE AI INSIGHTS */}
      <ExecutiveInsightsPanel />

      {/* 4-CARD PREDICTIVE FORECAST */}
      <ForecastCards
        projectedReadiness={89.7}
        readinessDate="2027-01-26"
        interviewPassProb={88.0}
        salaryProjection="$145,000 - $185,000"
        marketIndex={85.6}
      />

      {/* INTERACTIVE WHAT-IF SIMULATOR */}
      <WhatIfSimulator />

      {/* SALARY PROJECTION PANEL */}
      <SalaryProjectionPanel
        baselineMedian={145000}
        projectedMedian={153700}
        potentialIncrease={8700}
      />

      {/* MARKET INTELLIGENCE RADAR */}
      <MarketIntelligencePanel />

      {/* Top Level Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Readiness Score</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-200">{currentMetrics.averageReadinessScore}%</h3>
            <span className={`text-sm font-bold mb-1 ${trends.readinessGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trends.readinessGrowth >= 0 ? '↑' : '↓'} {Math.abs(trends.readinessGrowth)}%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Verified Skills</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-200">{currentMetrics.totalSkills}</h3>
            <span className={`text-sm font-bold mb-1 ${trends.skillsAdded >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trends.skillsAdded >= 0 ? '↑' : '↓'} {Math.abs(trends.skillsAdded)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Critical Gaps Remaining</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-200">{currentMetrics.totalGaps}</h3>
            <span className={`text-sm font-bold mb-1 ${trends.gapsClosed >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trends.gapsClosed > 0 ? 'Closed ' : ''} {trends.gapsClosed}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Completed Roadmap Actions</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-200">{currentMetrics.completedRoadmapItems}</h3>
            <span className={`text-sm font-bold mb-1 ${trends.itemsCompleted >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              +{trends.itemsCompleted} period
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
           <h2 className="text-lg font-bold text-slate-200 mb-6">Career Readiness Trend</h2>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="date" stroke="#475569" fontSize={12} tickMargin={10} />
                 <YAxis stroke="#475569" fontSize={12} domain={[0, 100]} />
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                   itemStyle={{ color: '#c7d2fe' }}
                 />
                 <Area type="monotone" dataKey="readiness" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReadiness)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* AI Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
             <span className="text-indigo-400">✨</span> Smart Insights
          </h2>
          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
             {insights.length === 0 ? (
               <div className="text-sm text-slate-500 italic">Not enough historical data to generate insights yet. Check back tomorrow!</div>
             ) : (
               insights.map((insight: { _id: string; type: string; title: string; description: string }) => (
                 <div key={insight._id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                   <div className="flex items-center gap-2 mb-1">
                     <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        insight.type === 'growth' ? 'bg-emerald-500/20 text-emerald-400' :
                        insight.type === 'achievement' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-indigo-500/20 text-indigo-400'
                     }`}>
                       {insight.type}
                     </span>
                     <h4 className="font-bold text-sm text-slate-300">{insight.title}</h4>
                   </div>
                   <p className="text-xs text-slate-400">{insight.description}</p>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
         <h2 className="text-lg font-bold text-slate-200 mb-6">Recent Activity Log</h2>
         <div className="space-y-4">
           {recentEvents.length === 0 ? (
             <div className="text-sm text-slate-500 italic">No recent activity found.</div>
           ) : (
             recentEvents.map((event: { _id: string; eventType: string; createdAt: string | number | Date; details?: { fileName?: string; skillName?: string } }) => (
               <div key={event._id} className="flex gap-4 items-start border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                 <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                 <div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">{event.eventType.replace(/_/g, ' ')}</span>
                     <span className="text-[10px] text-slate-600">{new Date(event.createdAt).toLocaleString()}</span>
                   </div>
                   {event.details?.fileName && (
                     <p className="text-sm text-slate-300 mt-1">File: {event.details.fileName}</p>
                   )}
                   {event.details?.skillName && (
                     <p className="text-sm text-slate-300 mt-1">Skill: <span className="font-semibold text-indigo-300">{event.details.skillName}</span></p>
                   )}
                 </div>
               </div>
             ))
           )}
         </div>
      </div>

      {/* AI STATUS BAR */}
      <AIStatusBar
        status={isLoading ? 'thinking' : error ? 'error' : 'active'}
        confidence={98.9}
        provider="Predictive AI Analytics Engine"
        latencyMs={105}
        lastUpdated="Just now"
      />
    </div>
  );
};
