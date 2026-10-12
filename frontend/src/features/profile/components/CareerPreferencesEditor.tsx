import React, { useState } from 'react';
import {
  Compass,
  X} from 'lucide-react';
import {
  CAREER_DOMAINS,
  SECONDARY_INTEREST_TAGS
} from '../../onboarding/careerDomains';

export interface CareerPreferencesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrimaryDomain: string;
  currentSecondaryDomains: string[];
  currentTargetRole: string;
  currentExperienceLevel: string;
  onSave: (data: {
    primaryCareerDomain: string;
    secondaryCareerDomains: string[];
    targetRole: string;
    experienceLevel: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export const CareerPreferencesEditor: React.FC<CareerPreferencesEditorProps> = ({
  isOpen,
  onClose,
  currentPrimaryDomain,
  currentSecondaryDomains,
  currentTargetRole,
  currentExperienceLevel,
  onSave,
  isSaving = false,
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState(() => {
    const match = CAREER_DOMAINS.find(
      (d) => d.name.toLowerCase() === currentPrimaryDomain.toLowerCase() || d.id === currentPrimaryDomain
    );
    return match ? match.id : 'software-engineering';
  });

  const [targetRole, setTargetRole] = useState(currentTargetRole || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(currentSecondaryDomains || []);
  const [experienceLevel, setExperienceLevel] = useState(currentExperienceLevel || 'entry');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDomain = CAREER_DOMAINS.find((d) => d.id === selectedDomainId) || CAREER_DOMAINS[0];
  const availableTags = SECONDARY_INTEREST_TAGS[selectedDomainId] || [];

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    const domain = CAREER_DOMAINS.find((d) => d.id === domainId);
    if (domain) {
      setTargetRole(domain.name);
      setSelectedTags([]);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave({
        primaryCareerDomain: currentDomain.name,
        secondaryCareerDomains: selectedTags,
        targetRole: targetRole.trim() || currentDomain.name,
        experienceLevel,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update career preferences');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-6 text-xs custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Configure Career Direction & Preferences
            </h3>
            <p className="text-[11px] text-slate-400">
              Your choices recalibrate skill gap analysis, recommendations, and live job matching.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Step 1: Primary Career Domain */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase block">
              1. Primary Career Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CAREER_DOMAINS.map((domain) => {
                const isSelected = selectedDomainId === domain.id;
                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => handleDomainChange(domain.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="text-xs font-bold block truncate text-white">
                        {domain.name}
                      </strong>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {domain.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Specific Target Role */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase block">
              2. Specific Target Role / Objective
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Principal AI Infrastructure Architect"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Step 3: Seniority / Experience Tier */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase block">
              3. Experience Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'entry', label: 'Entry' },
                { id: 'mid', label: 'Mid' },
                { id: 'senior', label: 'Senior' },
                { id: 'lead', label: 'Staff / Lead' },
                { id: 'executive', label: 'Executive' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setExperienceLevel(tier.id)}
                  className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    experienceLevel === tier.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Specialization Focus Areas */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase block">
                4. Secondary Specialization Tags
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      # {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !targetRole.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              {isSaving ? 'Synchronizing...' : 'Save & Recalibrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
