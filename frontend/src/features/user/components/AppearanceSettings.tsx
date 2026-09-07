import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { useTheme, Theme } from '../../../theme/ThemeContext';
import { Icon } from '../../../components/primitives/Icon';

export const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: Theme; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'dark',
      title: 'Dark Mode',
      desc: 'High-contrast dark palette engineered for focus',
      icon: (
        <Icon size="md">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Icon>
      ),
    },
    {
      id: 'light',
      title: 'Light Mode',
      desc: 'Clean, high-visibility bright interface',
      icon: (
        <Icon size="md">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        </Icon>
      ),
    },
    {
      id: 'system',
      title: 'System Preference',
      desc: 'Synchronizes automatically with system OS settings',
      icon: (
        <Icon size="md">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </Icon>
      ),
    },
  ];

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)]">
          Appearance & Visual Theme
        </h3>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themes.map(t => {
            const isSelected = theme === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-[var(--radius-lg)] border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-interactive-primary)]/10 border-[var(--color-interactive-primary)] shadow-sm'
                    : 'bg-[var(--color-bg-surface-sunken)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center ${
                      isSelected
                        ? 'bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)]'
                        : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {t.icon}
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-[var(--color-interactive-primary)]">
                      ✓ Active
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-sm font-bold text-[var(--color-text-primary)] block">
                    {t.title}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] block mt-0.5">
                    {t.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

AppearanceSettings.displayName = 'AppearanceSettings';
