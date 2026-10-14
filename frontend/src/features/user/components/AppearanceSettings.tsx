import React from 'react';
import { Palette } from 'lucide-react';

/** SkillBridge has one light design; this says so instead of offering a theme switch that would do nothing. */
export const AppearanceSettings: React.FC = () => (
  <section className="rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-sm sm:p-6" aria-labelledby="appearance-heading" data-testid="appearance-settings">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet">
        <Palette className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 id="appearance-heading" className="font-heading text-lg font-bold text-aurora-ink">
          Appearance
        </h3>
        <p className="text-sm text-aurora-muted">
          SkillBridge uses one light design. A dark theme is not available. Your browser&apos;s zoom and reduced-motion settings are respected on every page.
        </p>
      </div>
    </div>
  </section>
);
