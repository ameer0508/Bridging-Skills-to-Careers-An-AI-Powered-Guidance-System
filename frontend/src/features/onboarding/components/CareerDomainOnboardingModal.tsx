import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Compass, CheckCircle2, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../components/composite/Toast';
import { GlassPanel } from '../../../components/experience/workspace';

export const CAREER_DOMAINS = [
  { id: 'software-engineering', name: 'Software Engineering', desc: 'Enterprise systems, architecture, and backend infrastructure' },
  { id: 'ai-ml', name: 'Artificial Intelligence & Machine Learning', desc: 'LLMs, computer vision, neural networks, and RAG pipelines' },
  { id: 'data-science', name: 'Data Science & Analytics', desc: 'Big data pipelines, statistical modeling, and business intelligence' },
  { id: 'cybersecurity', name: 'Cybersecurity', desc: 'Application security, penetration testing, SOC, and cloud security' },
  { id: 'cloud-devops', name: 'Cloud & DevOps', desc: 'Kubernetes, CI/CD pipelines, terraform, and infrastructure as code' },
  { id: 'web-fullstack', name: 'Web & Full Stack Development', desc: 'React, Node.js, modern web frameworks, and client UX' },
  { id: 'mobile-dev', name: 'Mobile Development', desc: 'iOS Swift, Android Kotlin, React Native, and cross-platform apps' },
  { id: 'product-management', name: 'Product Management', desc: 'Product strategy, roadmap execution, and user research' },
  { id: 'ui-ux-design', name: 'UI/UX & Design', desc: 'Design systems, user research, wireframing, and interactive prototyping' },
  { id: 'business-consulting', name: 'Business & Consulting', desc: 'Strategy consulting, process optimization, and operations management' },
  { id: 'finance-fintech', name: 'Finance & Fintech', desc: 'Quantitative finance, trading platforms, and financial intelligence' },
  { id: 'research-academia', name: 'Research & Academia', desc: 'Applied scientific research, paper publishing, and R&D' },
];

export const SECONDARY_INTEREST_TAGS: Record<string, string[]> = {
  'software-engineering': ['Distributed Systems', 'Microservices', 'System Design', 'API Architecture', 'Database Optimization'],
  'ai-ml': ['PyTorch / TensorFlow', 'Vector Databases', 'Prompt Engineering', 'MLOps', 'Computer Vision'],
  'data-science': ['Pandas & NumPy', 'SQL & Data Warehousing', 'PowerBI / Tableau', 'Predictive Modeling'],
  'cybersecurity': ['Cloud Security (AWS/GCP)', 'Penetration Testing', 'SIEM & Threat Detection', 'Zero Trust Architecture'],
  'cloud-devops': ['Kubernetes & Helm', 'Docker Containers', 'Terraform', 'GitHub Actions CI/CD', 'AWS / Azure'],
  'web-fullstack': ['React 19 & Next.js', 'Node.js & Express', 'TypeScript', 'Tailwind CSS', 'GraphQL'],
  'mobile-dev': ['React Native', 'Swift & SwiftUI', 'Kotlin', 'Flutter', 'Mobile System Design'],
  'product-management': ['Agile & Scrum', 'User Analytics', 'Feature Prioritization', 'Product Growth'],
  'ui-ux-design': ['Figma Design Systems', 'User Research', 'Prototyping', 'Accessibility (WCAG)'],
  'business-consulting': ['Business Strategy', 'Financial Modeling', 'Process Automation', 'Stakeholder Management'],
  'finance-fintech': ['Algorithmic Trading', 'Risk Analytics', 'Payment Gateways', 'Blockchain & Smart Contracts'],
  'research-academia': ['Deep Learning Papers', 'Algorithm Complexity', 'Experimental Design', 'Data Visualization'],
};

export interface CareerDomainOnboardingModalProps {
  isOpen: boolean;
  onComplete?: () => void;
}

export const CareerDomainOnboardingModal: React.FC<CareerDomainOnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [primaryDomain, setPrimaryDomain] = useState<string>('software-engineering');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>('Full Stack Software Engineer');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeDomainObj = CAREER_DOMAINS.find((d) => d.id === primaryDomain) || CAREER_DOMAINS[0];
  const availableTags = SECONDARY_INTEREST_TAGS[primaryDomain] || SECONDARY_INTEREST_TAGS['software-engineering'];

  const handleSelectDomain = (domainId: string, domainName: string) => {
    setPrimaryDomain(domainId);
    setSelectedInterests([]);
    setTargetRole(domainName);
  };

  const handleToggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      if (selectedInterests.length >= 5) return;
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleSubmitOnboarding = async () => {
    setIsSubmitting(true);
    const domainName = activeDomainObj.name;

    try {
      const payload = {
        primaryCareerDomain: domainName,
        secondaryCareerDomains: selectedInterests,
        targetRole: targetRole.trim() || domainName,
        onboardingCompleted: true,
      };

      const response = await apiClient.put('/users/me', payload);
      const updatedUser = response.data.data;

      updateUser({
        primaryCareerDomain: updatedUser.primaryCareerDomain,
        secondaryCareerDomains: updatedUser.secondaryCareerDomains,
        targetRole: updatedUser.targetRole,
        targetCareerId: updatedUser.targetCareerId,
        onboardingCompleted: true,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['career-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['careers'] }),
        queryClient.invalidateQueries({ queryKey: ['skills'] }),
        queryClient.invalidateQueries({ queryKey: ['readiness'] }),
        queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
        queryClient.invalidateQueries({ queryKey: ['roadmap'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      ]);

      addToast({
        type: 'success',
        message: `Career Domain Activated: [${domainName}]! System Intelligence Initialized.`,
      });

      if (onComplete) onComplete();
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to complete onboarding. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Career Domain Onboarding Wizard"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
    >
      <GlassPanel className="max-w-3xl w-full p-6 sm:p-8 space-y-6 border-indigo-500/50 shadow-2xl relative overflow-hidden font-mono text-xs max-h-[90vh] overflow-y-auto">
        {/* TOP STEP INDICATOR */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                SkillBridge Intelligence Activation
              </h2>
              <p className="text-xs text-slate-400">
                Personalized Career Domain Onboarding • Step {step} of 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                  step === s
                    ? 'bg-indigo-600 text-white border border-indigo-400/50 shadow-md'
                    : step > s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border border-white/10'
                }`}
              >
                {step > s ? '✓' : s}
              </span>
            ))}
          </div>
        </div>

        {/* STEP 1: PRIMARY CAREER DOMAIN SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                What primary career domain do you want to pursue?
              </h3>
              <p className="text-xs text-slate-400">
                Select one primary domain. This choice grounds your initial career matches, readiness evaluation, recommendations, and live job search.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {CAREER_DOMAINS.map((domain) => {
                const isSelected = primaryDomain === domain.id;
                return (
                  <button
                    key={domain.id}
                    onClick={() => handleSelectDomain(domain.id, domain.name)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-indigo-500/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-white block">{domain.name}</strong>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{domain.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Continue to Specializations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SECONDARY INTERESTS & SPECIALIZATIONS */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Select Secondary Specializations for [{activeDomainObj.name}]
              </h3>
              <p className="text-xs text-slate-400">
                Choose up to 5 secondary interest areas to fine-tune your skill gap prioritized roadmap.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Available Specializations:</span>
                <span className="text-indigo-400 font-bold">{selectedInterests.length} / 5 Selected</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleInterest(tag)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-md'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Define Target Role</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TARGET ROLE CONFIRMATION & ACTIVATION */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Define Your Specific Target Role Title
              </h3>
              <p className="text-xs text-slate-400">
                Specify your exact target job title (e.g. Senior Security Engineer, Backend Architect, Data Scientist).
              </p>
            </div>

            <div className="space-y-4 p-5 rounded-xl bg-slate-950/80 border border-indigo-500/40">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Target Role Title:</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder={`e.g. ${activeDomainObj.name} Lead...`}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 font-mono text-[11px]">
                <span className="text-[10px] text-cyan-300 font-bold uppercase block tracking-wider">
                  YOUR CAREER DIRECTION SUMMARY
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-400">PRIMARY DOMAIN:</span>
                  <strong className="text-cyan-300">{activeDomainObj.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TARGET ROLE:</span>
                  <strong className="text-emerald-300">{targetRole || activeDomainObj.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SPECIALIZATIONS:</span>
                  <strong className="text-purple-300">
                    {selectedInterests.length > 0 ? selectedInterests.join(', ') : 'General Pathway'}
                  </strong>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-white/5">
                  SkillBridge will now personalize your career matching, skill gap prioritization, readiness scoring, learning roadmap, live JSearch discovery, and STAR interview evaluation around this direction.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={handleSubmitOnboarding}
                disabled={isSubmitting || !targetRole.trim()}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Activating Intelligence...' : 'ACTIVATE CAREER INTELLIGENCE'}</span>
              </button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export default CareerDomainOnboardingModal;
