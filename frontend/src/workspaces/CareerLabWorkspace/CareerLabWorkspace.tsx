import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { careerLabApi, type CareerOption } from '../../features/careerLab/careerLabApi';
import { ComparePanel } from '../../features/careerLab/components/ComparePanel';
import { WhatIfPanel } from '../../features/careerLab/components/WhatIfPanel';
import { FreshnessPanel } from '../../features/careerLab/components/FreshnessPanel';
import { TransitionPanel } from '../../features/careerLab/components/TransitionPanel';
import { ActivityPanel } from '../../features/careerLab/components/ActivityPanel';
import { Loading } from '../../features/careerLab/components/labUi';

const TABS = [
  { id: 'compare', label: 'Compare' },
  { id: 'what-if', label: 'What-if' },
  { id: 'freshness', label: 'Skill freshness' },
  { id: 'transition', label: 'Transition plan' },
  { id: 'activity', label: 'Activity' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/**
 * Career Lab: explore careers against your own evidence without changing it. Every figure on
 * this page comes from the same scoring rules as the rest of SkillBridge.
 */
export const CareerLabWorkspace: React.FC = () => {
  const [active, setActive] = useState<TabId>('compare');
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const catalog = useQuery<CareerOption[]>({ queryKey: ['career-lab', 'catalog'], queryFn: careerLabApi.catalog, staleTime: 10 * 60 * 1000 });
  const careers = catalog.data || [];

  // Arrow keys move between tabs, as expected of a tab list
  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = TABS.findIndex((t) => t.id === active);
    const next =
      event.key === 'ArrowRight' ? TABS[(index + 1) % TABS.length]
      : event.key === 'ArrowLeft' ? TABS[(index + TABS.length - 1) % TABS.length]
      : event.key === 'Home' ? TABS[0]
      : event.key === 'End' ? TABS[TABS.length - 1]
      : null;
    if (!next) return;
    event.preventDefault();
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4">
      <header className="flex items-start gap-4 p-6 rounded-3xl border border-white/15 bg-slate-950/80">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-300 shrink-0">
          <FlaskConical className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">Career Lab</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Compare careers, test what would change your match, check how recent your skills are and plan a move in stages.
            Scenarios here are hypothetical: they never change your profile, and they do not predict hiring outcomes.
          </p>
        </div>
      </header>

      <div role="tablist" aria-label="Career Lab sections" className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(element) => { tabRefs.current[tab.id] = element; }}
            type="button"
            role="tab"
            id={`lab-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`lab-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            className={`py-2 px-4 rounded-xl text-xs font-bold border cursor-pointer ${
              active === tab.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`lab-panel-${active}`} aria-labelledby={`lab-tab-${active}`}>
        {catalog.isLoading ? (
          <Loading label="Loading careers..." />
        ) : (
          <>
            {active === 'compare' && <ComparePanel careers={careers} />}
            {active === 'what-if' && <WhatIfPanel careers={careers} />}
            {active === 'freshness' && <FreshnessPanel />}
            {active === 'transition' && <TransitionPanel careers={careers} />}
            {active === 'activity' && <ActivityPanel />}
          </>
        )}
      </div>
    </div>
  );
};

CareerLabWorkspace.displayName = 'CareerLabWorkspace';
export default CareerLabWorkspace;
