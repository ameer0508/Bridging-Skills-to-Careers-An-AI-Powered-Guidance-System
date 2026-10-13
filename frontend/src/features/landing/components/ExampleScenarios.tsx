import React from 'react';
import { Compass, FileText, GraduationCap, Info } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

/**
 * What SkillBridge does in three typical situations. Deliberately without people: no names, faces,
 * ratings, quotes or outcomes, because SkillBridge has no customer stories or measured user
 * outcomes to report. Each step names a feature that exists.
 */
const SCENARIOS = [
  {
    icon: Compass,
    situation: 'A final-year student unsure which role fits',
    steps: [
      'Upload a resume; every skill found is shown with the line it came from.',
      'See match scores for 20 careers, each requirement marked as evidenced or missing.',
      'Try a what-if: add a skill or project and see which scores would change.',
    ],
  },
  {
    icon: FileText,
    situation: 'A developer moving from frontend to data engineering',
    steps: [
      'Compare the two careers by requirements and current evidence.',
      'Get a staged transition plan through nearer careers.',
      'Follow a roadmap paced to the weekly hours you set, with official documentation links.',
    ],
  },
  {
    icon: GraduationCap,
    situation: 'A candidate preparing for GATE CS alongside a job search',
    steps: [
      'Practise original questions marked by the official pattern, timed on the server.',
      'See progress by syllabus topic and a study plan built from weak topics.',
      'Exam practice stays separate: it never changes career scores.',
    ],
  },
];

export const ExampleScenarios: React.FC = () => (
  <section className="py-24 px-4 max-w-7xl mx-auto relative" aria-labelledby="scenarios-heading" data-testid="example-scenarios">
    <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
        <Info className="w-4 h-4 text-indigo-300" aria-hidden="true" />
        <span className="text-xs font-mono font-bold text-indigo-300 tracking-wider uppercase">Example scenarios</span>
      </div>
      <h2 id="scenarios-heading" className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        What SkillBridge does, step by step
      </h2>
      <p className="text-slate-300 text-base sm:text-lg" data-testid="scenarios-note">
        These are example situations, not customer stories. SkillBridge has no user outcomes or reviews to report, so none are shown.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {SCENARIOS.map(({ icon: Icon, situation, steps }) => (
        <TiltCard key={situation} glowColor="rgba(99, 102, 241, 0.18)" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
            <h3 className="text-base font-bold text-white">{situation}</h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {steps.map(step => <li key={step}>{step}</li>)}
          </ol>
        </TiltCard>
      ))}
    </div>
  </section>
);

export default ExampleScenarios;
