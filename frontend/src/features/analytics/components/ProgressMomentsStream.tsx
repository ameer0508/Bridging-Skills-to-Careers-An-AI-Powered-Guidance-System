import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  Video,
  Award,
} from 'lucide-react';

/** Values recorded with a progress event; they are shown as text. */
type EventDetails = Record<string, string | number | undefined>;

export interface ProgressEventItem {
  _id: string;
  eventType: string;
  data?: EventDetails;
  details?: EventDetails;
  timestamp?: string | number | Date;
  createdAt?: string | number | Date;
}

export interface ProgressMomentsStreamProps {
  events: ProgressEventItem[];
  onNavigateAction?: (route: string) => void;
}

export const ProgressMomentsStream: React.FC<ProgressMomentsStreamProps> = ({
  events = [],
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const getEventMeta = (eventType: string) => {
    switch (eventType) {
      case 'skill_added':
        return {
          label: 'Skill Indexed',
          icon: Cpu,
          badgeColor: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25',
          dotColor: 'bg-cyan-400',
          description: 'Added a verified technical capability to your profile.',
        };
      case 'roadmap_progress':
        return {
          label: 'Roadmap Milestone',
          icon: CheckCircle2,
          badgeColor: 'bg-purple-500/10 text-aurora-violet border-purple-500/20',
          dotColor: 'bg-purple-400',
          description: 'Executed an active learning curriculum task.',
        };
      case 'resume_uploaded':
      case 'resume_parsed':
      case 'resume_replaced':
        return {
          label: 'Resume Evidence',
          icon: FileText,
          badgeColor: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25',
          dotColor: 'bg-indigo-400',
          description: 'Supplied authentic resume artifact for skill extraction.',
        };
      case 'interview_completed':
        return {
          label: 'Interview Practice',
          icon: Video,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-400',
          description: 'Completed mock interview evaluation session.',
        };
      case 'recommendation_completed':
        return {
          label: 'Action Completed',
          icon: Award,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          dotColor: 'bg-amber-400',
          description: 'Resolved a high-priority career recommendation.',
        };
      default:
        return {
          label: eventType.replace(/_/g, ' '),
          icon: Sparkles,
          badgeColor: 'bg-aurora-canvas text-aurora-muted border-aurora-line',
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
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurora-line pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-aurora-ink">
              Moments That Moved Your Profile
            </h3>
          </div>
          <p className="text-xs text-aurora-muted">
            Chronological log of verified milestones, skill verifications, and roadmap actions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-aurora-canvas/60 p-1 rounded-xl border border-aurora-line text-xs">
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
                  ? 'bg-aurora-canvas text-aurora-ink font-semibold'
                  : 'text-aurora-muted hover:text-aurora-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <Clock className="w-8 h-8 text-aurora-muted mx-auto" />
          <p className="text-sm font-semibold text-aurora-muted">No telemetry events logged yet</p>
          <p className="text-xs text-aurora-muted max-w-sm mx-auto">
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
                <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-aurora-line ${meta.dotColor} shadow-md group-hover:scale-125 transition`} />

                {/* Event Card */}
                <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-line transition space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.badgeColor}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-aurora-muted font-mono">
                        {displayDate}
                      </span>
                    </div>

                    <IconComp className="w-4 h-4 text-aurora-muted group-hover:text-aurora-muted transition" />
                  </div>

                  <p className="text-xs text-aurora-muted leading-relaxed font-medium">
                    {meta.description}
                  </p>

                  {/* Specific Event Metadata Details */}
                  {details.skillName && (
                    <div className="pt-2 border-t border-aurora-line flex items-center gap-2 text-xs font-mono">
                      <span className="text-aurora-muted">Skill:</span>
                      <span className="text-aurora-violet font-bold">{details.skillName}</span>
                      {details.category && (
                        <span className="text-[10px] text-aurora-muted">({details.category})</span>
                      )}
                    </div>
                  )}

                  {details.fileName && (
                    <div className="pt-2 border-t border-aurora-line flex items-center gap-2 text-xs font-mono">
                      <span className="text-aurora-muted">File:</span>
                      <span className="text-aurora-indigo font-bold">{details.fileName}</span>
                    </div>
                  )}

                  {details.title && (
                    <div className="pt-2 border-t border-aurora-line flex items-center gap-2 text-xs font-mono">
                      <span className="text-aurora-muted">Task:</span>
                      <span className="text-aurora-violet font-bold">{details.title}</span>
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
