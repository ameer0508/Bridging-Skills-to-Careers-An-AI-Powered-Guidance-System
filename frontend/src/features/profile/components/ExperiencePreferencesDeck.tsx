import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Check,
  Sliders
} from 'lucide-react';
import { useTheme, Theme } from '../../../theme/ThemeContext';
import { GlassPanel } from '../../../components/experience/workspace';

interface NotificationState {
  emailAlerts: boolean;
  careerDigest: boolean;
  roadmapReminders: boolean;
  aiTips: boolean;
}

const STORAGE_KEY = 'skillbridge-notifications';

const getInitialNotificationState = (): NotificationState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Fallback
  }
  return {
    emailAlerts: true,
    careerDigest: true,
    roadmapReminders: true,
    aiTips: false,
  };
};

export const ExperiencePreferencesDeck: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationState>(getInitialNotificationState);

  const toggleNotification = (key: keyof NotificationState) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage unavailable
      }
      return updated;
    });
  };

  const themes: Array<{ id: Theme; label: string; desc: string; icon: typeof Moon }> = [
    {
      id: 'dark',
      label: 'Dark Mode',
      desc: 'Engineered for sustained technical focus and contrast.',
      icon: Moon,
    },
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Crisp, high-visibility bright workspace interface.',
      icon: Sun,
    },
    {
      id: 'system',
      label: 'System Sync',
      desc: 'Synchronizes dynamically with host operating system.',
      icon: Laptop,
    },
  ];

  return (
    <div className="w-full font-mono">
      <GlassPanel className="p-6 sm:p-8 space-y-8 border-indigo-500/30">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Workspace Preferences & Environment
            </span>
            <p className="text-[11px] text-slate-400">
              Customize visual ergonomics and system communication channels for your SkillBridge session.
            </p>
          </div>
        </div>

        {/* Section 1: Visual Theme Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-300 uppercase block">
            Visual Appearance
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div>
                    <strong className="text-xs text-white block">{t.label}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{t.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-[11px] font-bold text-slate-300 uppercase block flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            Communication & Advisory Alerts
          </label>

          <div className="space-y-2">
            {[
              {
                key: 'emailAlerts' as const,
                title: 'Security & System Alerts',
                description: 'Critical authentication events and session security notices.',
              },
              {
                key: 'careerDigest' as const,
                title: 'Career Alignment Digest',
                description: 'Notifications when role match fit or market demand recalibrates.',
              },
              {
                key: 'roadmapReminders' as const,
                title: 'Roadmap Milestone Reminders',
                description: 'Periodic progress nudges to maintain your skill progression momentum.',
              },
              {
                key: 'aiTips' as const,
                title: 'Proactive AI Advisory Insights',
                description: 'Contextual recommendations when new skill opportunities emerge.',
              },
            ].map((item) => {
              const isChecked = notifications[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleNotification(item.key)}
                  className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/5 hover:border-white/10 transition cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <strong className="text-xs text-white block">{item.title}</strong>
                    <span className="text-[10px] text-slate-400 block">{item.description}</span>
                  </div>

                  <button
                    type="button"
                    aria-label={`Toggle ${item.title}`}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        isChecked ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
