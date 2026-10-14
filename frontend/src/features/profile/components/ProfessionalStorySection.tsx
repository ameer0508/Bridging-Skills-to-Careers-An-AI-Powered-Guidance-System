import React, { useState } from 'react';
import {
  BookOpen,
  Edit3,
  Check,
  FileText,
  Quote
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ProfessionalStorySectionProps {
  bio?: string;
  extractedResumeSummary?: string;
  onSaveBio: (newBio: string) => Promise<void>;
  isSaving?: boolean;
}

export const ProfessionalStorySection: React.FC<ProfessionalStorySectionProps> = ({
  bio,
  extractedResumeSummary,
  onSaveBio,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(bio || extractedResumeSummary || '');
  const [error, setError] = useState<string | null>(null);

  const currentDisplayStory = bio || extractedResumeSummary;
  const isFromResume = !bio && Boolean(extractedResumeSummary);

  const handleStartEdit = () => {
    setText(bio || extractedResumeSummary || '');
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    try {
      await onSaveBio(text.trim());
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save professional narrative');
    }
  };

  return (
    <div className="w-full tabular-nums">
      <GlassPanel className="p-6 sm:p-8 space-y-5 border-aurora-violet/25">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-aurora-line">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-aurora-indigo" />
              Professional Narrative & Story
            </span>
            <p className="text-[11px] text-aurora-muted">
              The overarching summary that conveys your technical depth, domain philosophy, and leadership trajectory.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={handleStartEdit}
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-aurora-ink hover:text-aurora-indigo text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-aurora-indigo" />
              <span>{currentDisplayStory ? 'Edit Story' : 'Write Story'}</span>
            </button>
          )}
        </div>

        {/* Narrative Surface */}
        {isEditing ? (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Write your professional narrative... (e.g. Distributed systems engineer with 6+ years designing fault-tolerant cloud architectures and mission-critical APIs.)"
                className="w-full p-4 rounded-2xl bg-aurora-canvas border border-aurora-violet/25 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-aurora-ink leading-relaxed resize-none"
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-aurora-muted">
                {text.length} / 1000 characters
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl bg-aurora-canvas hover:bg-aurora-line text-aurora-muted text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Narrative'}</span>
              </button>
            </div>
          </div>
        ) : currentDisplayStory ? (
          <div className="p-6 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3 relative overflow-hidden">
            <Quote className="w-8 h-8 text-indigo-500/10 absolute -top-1 -left-1 pointer-events-none" />
            <p className="text-xs sm:text-sm text-aurora-ink leading-relaxed font-sans font-normal relative z-10">
              {currentDisplayStory}
            </p>

            {isFromResume && (
              <div className="pt-2 border-t border-aurora-line flex items-center justify-between text-[10px] text-aurora-muted">
                <span className="flex items-center gap-1.5 text-aurora-violet/80">
                  <FileText className="w-3 h-3" />
                  Grounded from parsed resume executive summary
                </span>
                <span className="text-aurora-muted">Click "Edit Story" to personalize directly</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-aurora-muted border border-dashed border-aurora-line rounded-2xl space-y-2">
            <BookOpen className="w-8 h-8 text-aurora-muted mx-auto" />
            <p className="font-semibold text-aurora-muted text-xs">
              Your professional story starts here.
            </p>
            <p className="text-[11px] text-aurora-muted max-w-md mx-auto">
              Add a concise narrative statement detailing your technical background, domain passion, and leadership mindset to ground AI guidance.
            </p>
            <button
              onClick={handleStartEdit}
              type="button"
              className="mt-2 px-4 py-1.5 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Compose Narrative</span>
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
