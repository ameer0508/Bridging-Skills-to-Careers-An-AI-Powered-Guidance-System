import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Switch } from '../../../components/base/Switch';

interface NotificationState {
  emailAlerts: boolean;
  careerDigest: boolean;
  roadmapReminders: boolean;
  aiTips: boolean;
}

const STORAGE_KEY = 'skillbridge-notifications';

const getInitialState = (): NotificationState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Fallback to default
  }
  return {
    emailAlerts: true,
    careerDigest: true,
    roadmapReminders: true,
    aiTips: false,
  };
};

export const NotificationPreferences: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationState>(getInitialState);

  const togglePref = (key: keyof NotificationState, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
  };

  const { emailAlerts, careerDigest, roadmapReminders, aiTips } = prefs;

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)]">
          Notification Preferences
        </h3>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              Email System Alerts
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] block">
              Important account security and parse status updates
            </span>
          </div>
          <Switch checked={emailAlerts} onChange={e => togglePref('emailAlerts', e.target.checked)} />
        </div>

        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              Career Alignment Digest
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] block">
              Weekly notifications when new career matches or fit score recalculations occur
            </span>
          </div>
          <Switch checked={careerDigest} onChange={e => togglePref('careerDigest', e.target.checked)} />
        </div>

        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              Roadmap Progress Reminders
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] block">
              Reminders to complete milestone action items in your active learning roadmap
            </span>
          </div>
          <Switch checked={roadmapReminders} onChange={e => togglePref('roadmapReminders', e.target.checked)} />
        </div>

        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
              AI Advisory Insights
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] block">
              Proactive AI career advice and skill gap notifications
            </span>
          </div>
          <Switch checked={aiTips} onChange={e => togglePref('aiTips', e.target.checked)} />
        </div>
      </CardBody>
    </Card>
  );
};

NotificationPreferences.displayName = 'NotificationPreferences';
