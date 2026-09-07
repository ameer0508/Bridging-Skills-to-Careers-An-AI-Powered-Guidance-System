import React from 'react';
import { XCircle, CheckCircle2, Sparkles, Scale } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

interface FeatureComparison {
  title: string;
  traditional: string;
  skillBridge: string;
}

export const WhySkillBridge: React.FC = () => {
  const comparisons: FeatureComparison[] = [
    {
      title: 'Skill Assessment',
      traditional: 'Manual self-ratings & subjective resume guessing',
      skillBridge: 'NLP resume parsing & vector skill embedding analysis',
    },
    {
      title: 'Career Match Precision',
      traditional: 'Generic job board searches & rigid job titles',
      skillBridge: '98%+ mathematically calculated vector similarity match',
    },
    {
      title: 'Gap Identification',
      traditional: 'Trial-and-error after rejected applications',
      skillBridge: 'Instant deterministic gap matrix spotlighting exact missing tools',
    },
    {
      title: 'Learning Guidance',
      traditional: 'Static course lists without personalized sequence',
      skillBridge: 'Adaptive 7-week milestone roadmap with curated projects',
    },
    {
      title: 'Progress Telemetry',
      traditional: 'Unmeasured learning with no readiness signal',
      skillBridge: 'Live Career Readiness Index & automated ATS score tracking',
    },
    {
      title: 'AI Transparency',
      traditional: 'Black-box recommendations with zero explanation',
      skillBridge: 'Explainable AI with clear reasoning & confidence scores',
    },
  ];

  return (
    <section id="comparison" className="py-24 px-4 max-w-7xl mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">
            Platform Differentiation
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Why Modern Talent Chooses <br />
          <span className="bg-linear-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            SkillBridge AI
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          See how commercial AI intelligence replaces outdated guesswork in tech career navigation.
        </p>
      </div>

      <TiltCard glowColor="rgba(99, 102, 241, 0.15)" className="p-6 md:p-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-160">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-4 w-1/3">Capability Area</th>
                <th className="pb-4 w-1/3 text-slate-500">Traditional Approach</th>
                <th className="pb-4 w-1/3 text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> SkillBridge AI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
              {comparisons.map((item, index) => (
                <tr key={index} className="hover:bg-white/2 transition-colors">
                  <td className="py-4 font-bold text-white pr-4">{item.title}</td>
                  <td className="py-4 text-slate-400 pr-4 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-500/80 shrink-0 mt-0.5" />
                    <span>{item.traditional}</span>
                  </td>
                  <td className="py-4 text-slate-100 font-medium bg-indigo-500/5 px-4 rounded-xl border border-indigo-500/10">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{item.skillBridge}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TiltCard>
    </section>
  );
};
