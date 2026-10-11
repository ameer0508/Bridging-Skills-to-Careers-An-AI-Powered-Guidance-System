import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  Video,
  Award,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export interface ProgressEventItem {
  _id: string;
  eventType: string;
  data?: Record<string, any>;
  details?: Record<string, any>;
  timestamp?: string | number | Date;
  createdAt?: string | number | Date;
}

export interface ProgressMomentsStreamProps {
  events: ProgressEventItem[];
  onNavigateAction?: (route: string) => void;
}

export const ProgressMomentsStream: React.FC<ProgressMomentsStreamProps> = ({
  events = [],
  onNavigateAction,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const getEventMeta = (eventType: string) => {
    switch (eventType) {
      case 'skill_added':
        return {
          label: 'Skill Indexed',
          icon: Cpu,
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dotColor: 'bg-cyan-400',
          description: 'Added a verified technical capability to your profile.',
        };
      case 'roadmap_progress':
        return {
          label: 'Roadmap Milestone',
          icon: CheckCircle2,
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dotColor: 'bg-purple-400',
          description: 'Executed an active learning curriculum task.',
        };
      case 'resume_uploaded':
      case 'resume_parsed':
      case 'resume_replaced':
        return {
          label: 'Resume Evidence',
          icon: FileText,
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          dotColor: 'bg-indigo-400',
          description: 'Supplied authentic resume artifact for skill extraction.',
        };
      case 'interview_completed':
        return {
          label: 'Interview Practice',
          icon: Video,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dotColor: 'bg-emerald-400',
          description: 'Completed mock interview evaluation session.',
        };
      case 'recommendation_completed':
        return {
          label: 'Action Completed',
          icon: Award,
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dotColor: 'bg-amber-400',
          description: 'Resolved a high-priority career recommendation.',
        };
      default:
        return {
          label: eventType.replace(/_/g, ' '),
          icon: Sparkles,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          dotColor: 'bg-indigo-400',
          description: 'Recorded developmental platform activity.',
        };
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (filterType === 'all') return true;
    if (filterType === 'skills') return evt.eventType === 'skill_added';
    if (filterType === 'roadmap') return evt.eventType === 'roadmap_progress';
    if (filterType === 'resume') return evt.eventType.includes('resume');
    return true;
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Moments That Moved Your Profile
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Chronological log of verified milestones, skill verifications, and roadmap actions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
          {[
            { id: 'all', label: 'All Moments' },
            { id: 'skills', label: 'Skills' },
            { id: 'roadmap', label: 'Roadmap' },
            { id: 'resume', label: 'Resume' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              type="button"
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No telemetry events logged yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Events appear automatically as you upload a resume, index skills, or complete curriculum tasks.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-indigo-500 before:via-slate-800 before:to-transparent">
          {filteredEvents.map((evt, idx) => {
            const meta = getEventMeta(evt.eventType);
            const IconComp = meta.icon;
            const eventDate = new Date(evt.timestamp || evt.createdAt || Date.now());
            const isDateValid = !isNaN(eventDate.getTime());
            const displayDate = isDateValid
              ? eventDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent activity';

            const details = evt.data || evt.details || {};

            return (
              <motion.div
                key={evt._id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="relative group"
              >
                {/* Timeline node marker */}
                <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${meta.dotColor} shadow-md group-hover:scale-125 transition`} />

                {/* Event Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-white/15 transition space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${meta.badgeColor}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {displayDate}
                      </span>
                    </div>

                    <IconComp className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {meta.description}
                  </p>

                  {/* Specific Event Metadata Details */}
                  {details.skillName && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">Skill:</span>
                      <span className="text-cyan-300 font-bold">{details.skillName}</span>
                      {details.category && (
                        <span className="text-[10px] text-slate-500">({details.category})</span>
                      )}
                    </div>
                  )}

                  {details.fileName && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">File:</span>
                      <span className="text-indigo-300 font-bold">{details.fileName}</span>
                    </div>
                  )}

                  {details.title && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">Task:</span>
                      <span className="text-purple-300 font-bold">{details.title}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

ProgressMomentsStream.displayName = 'ProgressMomentsStream';
