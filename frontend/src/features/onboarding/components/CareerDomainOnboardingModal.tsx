import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Compass, CheckCircle2, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../components/composite/Toast';
import { GlassPanel } from '../../../components/experience/workspace';
import { Portal } from '../../../components/primitives/Portal/Portal';
import { CAREER_DOMAINS, SECONDARY_INTEREST_TAGS } from '../careerDomains';

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

  // Rendered outside the Aurora shell, in the dark portal layer, so it keeps its own design
  return (
    <Portal>
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Career Domain Onboarding Wizard"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurora-canvas/60 backdrop-blur-xl animate-fade-in"
    >
      <div className="w-full max-w-3xl">
      <GlassPanel className="max-w-3xl w-full p-6 sm:p-8 space-y-6 border-aurora-violet/25 shadow-2xl relative overflow-hidden text-xs max-h-[90vh] overflow-y-auto">
        {/* TOP STEP INDICATOR */}
        <div className="flex items-center justify-between pb-4 border-b border-aurora-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-aurora-canvas rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-aurora-violet" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-aurora-ink tracking-tight">
                SkillBridge Intelligence Activation
              </h2>
              <p className="text-xs text-aurora-muted">
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
                    ? 'text-white [background:var(--aurora-gradient-action)] border border-indigo-400/50 shadow-aurora-sm'
                    : step > s
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-aurora-canvas text-aurora-muted border border-aurora-line'
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
              <h3 className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                <Compass className="w-4 h-4 text-aurora-violet" />
                What primary career domain do you want to pursue?
              </h3>
              <p className="text-xs text-aurora-muted">
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
                        ? 'bg-violet-50 border-indigo-500 text-aurora-ink shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                        : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:border-aurora-violet/25 hover:text-aurora-indigo'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-aurora-ink block">{domain.name}</strong>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-aurora-violet shrink-0" />}
                    </div>
                    <p className="text-[10px] text-aurora-muted leading-tight">{domain.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-aurora-line">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-5 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
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
              <h3 className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-aurora-violet" />
                Select Secondary Specializations for [{activeDomainObj.name}]
              </h3>
              <p className="text-xs text-aurora-muted">
                Choose up to 5 secondary interest areas to fine-tune your skill gap prioritized roadmap.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
              <div className="flex items-center justify-between text-aurora-muted text-[11px]">
                <span>Available Specializations:</span>
                <span className="text-aurora-indigo font-bold">{selectedInterests.length} / 5 Selected</span>
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
                          ? 'bg-violet-50 border-purple-500 text-aurora-violet shadow-md'
                          : 'bg-aurora-canvas border-aurora-line text-aurora-muted hover:text-aurora-ink'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-aurora-line">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo font-bold text-xs cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-5 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
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
              <h3 className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Define Your Specific Target Role Title
              </h3>
              <p className="text-xs text-aurora-muted">
                Specify your exact target job title (e.g. Senior Security Engineer, Backend Architect, Data Scientist).
              </p>
            </div>

            <div className="space-y-4 p-5 rounded-xl bg-aurora-canvas/60 border border-aurora-violet/25">
              <div className="space-y-2">
                <label className="text-xs font-bold text-aurora-muted block">Target Role Title:</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder={`e.g. ${activeDomainObj.name} Lead...`}
                  className="w-full p-3 rounded-xl bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-violet-50 border border-aurora-violet/25 space-y-2 text-[11px]">
                <span className="text-[10px] text-aurora-violet font-bold uppercase block tracking-wider">
                  YOUR CAREER DIRECTION SUMMARY
                </span>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">PRIMARY DOMAIN:</span>
                  <strong className="text-aurora-violet">{activeDomainObj.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">TARGET ROLE:</span>
                  <strong className="text-emerald-700">{targetRole || activeDomainObj.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">SPECIALIZATIONS:</span>
                  <strong className="text-aurora-violet">
                    {selectedInterests.length > 0 ? selectedInterests.join(', ') : 'General Pathway'}
                  </strong>
                </div>
                <p className="text-[10px] text-aurora-muted leading-tight pt-1 border-t border-aurora-line">
                  SkillBridge will now personalize your career matching, skill gap prioritization, readiness scoring, learning roadmap, live JSearch discovery, and STAR interview evaluation around this direction.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-aurora-line">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo font-bold text-xs cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={handleSubmitOnboarding}
                disabled={isSubmitting || !targetRole.trim()}
                className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Activating Intelligence...' : 'ACTIVATE CAREER INTELLIGENCE'}</span>
              </button>
            </div>
          </div>
        )}
      </GlassPanel>
      </div>
    </div>
    </Portal>
  );
};

export default CareerDomainOnboardingModal;
