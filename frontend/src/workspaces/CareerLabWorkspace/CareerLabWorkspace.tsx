import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { careerLabApi, type CareerOption } from '../../features/careerLab/careerLabApi';
import { ComparePanel } from '../../features/careerLab/components/ComparePanel';
import { WhatIfPanel } from '../../features/careerLab/components/WhatIfPanel';
import { FreshnessPanel } from '../../features/careerLab/components/FreshnessPanel';
import { VerifyPanel } from '../../features/careerLab/components/VerifyPanel';
import { TransitionPanel } from '../../features/careerLab/components/TransitionPanel';
import { ActivityPanel } from '../../features/careerLab/components/ActivityPanel';
import { Loading } from '../../design/aurora/labUi';
import { PageHeader, Pill, TabPanel, Tabs } from '../../design/aurora/kit';

const TABS = [
  { id: 'compare', label: 'Compare' },
  { id: 'what-if', label: 'What-if' },
  { id: 'freshness', label: 'Skill freshness' },
  { id: 'verify', label: 'Verify skills' },
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
  const catalog = useQuery<CareerOption[]>({ queryKey: ['career-lab', 'catalog'], queryFn: careerLabApi.catalog, staleTime: 10 * 60 * 1000 });
  const careers = catalog.data || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <PageHeader
        eyebrow="Career Lab"
        icon={<FlaskConical className="h-7 w-7" aria-hidden="true" />}
        title="Test careers against your evidence"
        lead="Compare careers, test what would change your match, check how recent your skills are and plan a move in stages. Scenarios here are hypothetical: they never change your profile, and they do not predict hiring outcomes."
        actions={<Pill tone="amber">Scenarios are never saved to your profile</Pill>}
      />

      <Tabs tabs={[...TABS]} value={active} onChange={setActive} label="Career Lab sections" idBase="lab" />

      <TabPanel idBase="lab" id={active}>
        {catalog.isLoading ? (
          <Loading label="Loading careers..." />
        ) : (
          <>
            {active === 'compare' && <ComparePanel careers={careers} />}
            {active === 'what-if' && <WhatIfPanel careers={careers} />}
            {active === 'freshness' && <FreshnessPanel />}
            {active === 'verify' && <VerifyPanel />}
            {active === 'transition' && <TransitionPanel careers={careers} />}
            {active === 'activity' && <ActivityPanel />}
          </>
        )}
      </TabPanel>
    </div>
  );
};

CareerLabWorkspace.displayName = 'CareerLabWorkspace';
export default CareerLabWorkspace;
