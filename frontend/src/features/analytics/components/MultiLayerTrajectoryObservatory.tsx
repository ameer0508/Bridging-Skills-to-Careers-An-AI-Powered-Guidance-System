import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  Layers,
  Award,
  Cpu,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react';

export interface HistoricalSnapshotItem {
  date: string | number | Date;
  averageReadinessScore: number;
  totalSkills: number;
  completedItems: number;
}

export interface MultiLayerTrajectoryObservatoryProps {
  snapshots: HistoricalSnapshotItem[];
  targetRoleTitle: string;
  periodName: string;
  activeReadiness: number;
  activeSkills: number;
  activeRoadmapItems: number;
}

type LayerMode = 'all' | 'readiness' | 'skills' | 'roadmap';

export const MultiLayerTrajectoryObservatory: React.FC<MultiLayerTrajectoryObservatoryProps> = ({
  snapshots,
  targetRoleTitle,
  periodName,
  activeReadiness,
  activeSkills,
  activeRoadmapItems,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerMode>('all');
  const [hoveredData, setHoveredData] = useState<any | null>(null);

  // Normalize snapshots for chart consumption
  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      // Fallback single baseline point from active telemetry
      return [
        {
          date: 'Baseline',
          formattedDate: 'Initial Calibration',
          readiness: activeReadiness,
          skills: activeSkills,
          completedItems: activeRoadmapItems,
        },
      ];
    }

    return snapshots.map((s) => {
      const d = new Date(s.date);
      const isDateValid = !isNaN(d.getTime());
      const label = isDateValid
        ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'Snapshot';
      const fullDate = isDateValid
        ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Live Telemetry';

      return {
        date: label,
        formattedDate: fullDate,
        readiness: Number(s.averageReadinessScore) || 0,
        skills: Number(s.totalSkills) || 0,
        completedItems: Number(s.completedItems) || 0,
      };
    });
  }, [snapshots, activeReadiness, activeSkills, activeRoadmapItems]);

  const maxCount = useMemo(() => {
    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.skills, d.completedItems, 10))
    );
    return Math.ceil(maxVal * 1.2);
  }, [chartData]);

  const layers: { id: LayerMode; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'all', label: 'Synchronized Layers', icon: Layers, color: 'text-white' },
    { id: 'readiness', label: 'Readiness Trajectory', icon: Award, color: 'text-indigo-400' },
    { id: 'skills', label: 'Skill Index', icon: Cpu, color: 'text-cyan-400' },
    { id: 'roadmap', label: 'Curriculum Velocity', icon: CheckCircle2, color: 'text-purple-400' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header controls & Layer filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Multi-Layer Trajectory Observatory
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-white/5">
              {periodName}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Synchronized timeline tracking readiness evolution, verified skills accumulation, and curriculum completions.
          </p>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
          {layers.map((layer) => {
            const IconComp = layer.icon;
            const isSelected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : layer.color}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snapshot Calibration Notice if < 2 snapshots */}
      {snapshots.length < 2 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Initial Telemetry Calibration Active</p>
            <p className="text-indigo-300/80">
              Your profile has {snapshots.length === 1 ? '1 recorded snapshot' : 'no prior snapshots'}. As you complete roadmap tasks, add verified skills, or upload new resume evidence, daily snapshots will systematically plot your longitudinal trajectory across this multi-layered canvas.
            </p>
          </div>
        </div>
      )}

      {/* Primary Chart Canvas */}
      <div className="h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            onMouseMove={(e) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                setHoveredData(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
          >
            <defs>
              <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="skillsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roadmapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            {/* Left Axis: Readiness Percentage (0-100) */}
            {(activeLayer === 'all' || activeLayer === 'readiness') && (
              <YAxis
                yAxisId="percentage"
                stroke="#818cf8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
            )}

            {/* Right Axis: Absolute Counts (Skills / Tasks) */}
            {(activeLayer === 'all' || activeLayer === 'skills' || activeLayer === 'roadmap') && (
              <YAxis
                yAxisId="counts"
                orientation="right"
                stroke="#22d3ee"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, maxCount]}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-mono text-slate-400">{data.formattedDate}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Telemetry Point
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {(activeLayer === 'all' || activeLayer === 'readiness') && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Readiness Score:
                          </span>
                          <span className="font-mono font-bold text-indigo-400">{data.readiness}%</span>
                        </div>
                      )}

                      {(activeLayer === 'all' || activeLayer === 'skills') && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Verified Skills:
                          </span>
                          <span className="font-mono font-bold text-cyan-300">{data.skills}</span>
                        </div>
                      )}

                      {(activeLayer === 'all' || activeLayer === 'roadmap') && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            Roadmap Actions:
                          </span>
                          <span className="font-mono font-bold text-purple-300">{data.completedItems}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* Layer 1: Readiness Trajectory */}
            {(activeLayer === 'all' || activeLayer === 'readiness') && (
              <Area
                yAxisId="percentage"
                type="monotone"
                dataKey="readiness"
                name="Readiness Score"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#readinessGradient)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}

            {/* Layer 2: Skills Accumulation */}
            {(activeLayer === 'all' || activeLayer === 'skills') && (
              <Line
                yAxisId="counts"
                type="monotone"
                dataKey="skills"
                name="Verified Skills"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4' }}
                activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}

            {/* Layer 3: Completed Roadmap Items */}
            {(activeLayer === 'all' || activeLayer === 'roadmap') && (
              <Line
                yAxisId="counts"
                type="monotone"
                dataKey="completedItems"
                name="Roadmap Items Done"
                stroke="#a855f7"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#a855f7' }}
                activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend & Synchronization Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-white/5">
          <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Readiness Score</span>
            <p className="text-[10px] text-slate-400">Target role qualification (0–100%)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-white/5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Capability Index</span>
            <p className="text-[10px] text-slate-400">Verified skills accumulated</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-white/5">
          <div className="w-3 h-3 rounded-full bg-purple-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Curriculum Tasks</span>
            <p className="text-[10px] text-slate-400">Completed roadmap milestones</p>
          </div>
        </div>
      </div>
    </div>
  );
};

MultiLayerTrajectoryObservatory.displayName = 'MultiLayerTrajectoryObservatory';
