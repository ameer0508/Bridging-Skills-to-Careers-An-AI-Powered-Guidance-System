import React, { useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Briefcase,
  Sparkles,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Compass,
  ArrowUpRight
} from 'lucide-react';

export interface CareerIdentityHeroProps {
  fullName: string;
  email: string;
  avatarUrl?: string;
  targetRole?: string;
  primaryCareerDomain?: string;
  location?: string;
  experienceLevel?: string;
  bio?: string;
  onUpdateIdentity: (data: { fullName: string; avatar: string; location: string }) => Promise<void>;
  isUpdating?: boolean;
}

export const CareerIdentityHero: React.FC<CareerIdentityHeroProps> = ({
  fullName,
  email,
  avatarUrl,
  targetRole,
  primaryCareerDomain,
  location,
  experienceLevel = 'entry',
  bio,
  onUpdateIdentity,
  isUpdating = false,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(fullName);
  const [editAvatar, setEditAvatar] = useState(avatarUrl || '');
  const [editLocation, setEditLocation] = useState(location || '');
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName = fullName?.trim() || email.split('@')[0];
  const displayHeadline = targetRole || primaryCareerDomain || 'Define your professional direction';
  const initialLetter = (displayName[0] || 'U').toUpperCase();

  const handleOpenEdit = () => {
    setEditName(fullName || '');
    setEditAvatar(avatarUrl || '');
    setEditLocation(location || '');
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await onUpdateIdentity({
        fullName: editName.trim(),
        avatar: editAvatar.trim(),
        location: editLocation.trim(),
      });
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update identity');
    }
  };

  const seniorityLabels: Record<string, string> = {
    entry: 'Early Career / Emerging Specialist',
    mid: 'Mid-Level Practitioner',
    senior: 'Senior Specialist',
    lead: 'Staff / Lead Architect',
    executive: 'Executive / Technical Fellow',
  };

  return (
    <div className="w-full relative font-mono">
      {/* Ambient Gentle Mesh Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-slate-950/60 rounded-3xl -z-10 border border-white/5" />

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          {/* Identity Presentation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* User Avatar Surface */}
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-xl ring-4 ring-indigo-500/10"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-700 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl ring-4 ring-indigo-500/10 border-2 border-white/15 tracking-wider">
                  {initialLetter}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-emerald-500/40 text-[9px] font-bold text-emerald-400 flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED
              </div>
            </div>

            {/* Editorial Name & Direction */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  CAREER IDENTITY CENTER
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                  {seniorityLabels[experienceLevel] || 'Professional'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {displayName}
              </h1>

              <p className="text-sm sm:text-base text-indigo-200/90 font-medium flex items-center gap-2 flex-wrap">
                <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{displayHeadline}</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {location || 'Remote / Global'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 truncate max-w-xs">{email}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="shrink-0 pt-2 md:pt-0">
            <button
              onClick={handleOpenEdit}
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg group"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>Edit Identity</span>
            </button>
          </div>
        </div>

        {/* Identity Context Bar */}
        <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Career Direction</span>
            <strong className="text-white text-sm block truncate">
              {targetRole || 'Not specified yet'}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Primary Career Domain</span>
            <strong className="text-indigo-300 text-sm block truncate">
              {primaryCareerDomain || 'General Engineering'}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Geographic Preference</span>
            <strong className="text-emerald-300 text-sm block truncate">
              {location || 'Remote Flexible'}
            </strong>
          </div>
        </div>
      </div>

      {/* Focused Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Edit Professional Identity
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update your publicly displayed identity and geographic profile.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                type="button"
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Shaik Ameer Sohail"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block uppercase">
                  Location / Base
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block uppercase">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                <span className="text-[10px] text-slate-500 block">
                  Leave blank to use your name's dynamic initial monogram.
                </span>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {saveError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editName.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isUpdating ? 'Saving...' : 'Save Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
