import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { careerLabApi, type CareerOption, type TransitionPlan } from '../careerLabApi';
import { EmptyState, ErrorNote, Loading, Note, SkillChips } from '../../../design/aurora/labUi';
import { errorText, fieldClass, formatDate, labelClass, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';

interface TransitionPanelProps {
  careers: CareerOption[];
}

/** Staged plans from the user's current evidence to a target career. */
export const TransitionPanel: React.FC<TransitionPanelProps> = ({ careers }) => {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState('');

  const plans = useQuery<TransitionPlan[]>({ queryKey: ['career-lab', 'plans'], queryFn: careerLabApi.plans });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['career-lab', 'plans'] });
  const create = useMutation<TransitionPlan, unknown, string>({ mutationFn: careerLabApi.createPlan, onSuccess: refresh });
  const remove = useMutation<void, unknown, string>({ mutationFn: careerLabApi.deletePlan, onSuccess: refresh });

  return (
    <section className={panelClass} aria-labelledby="transition-heading">
      <div className="space-y-1">
        <h2 id="transition-heading" className="font-heading text-lg font-bold text-aurora-ink">Transition plan</h2>
        <p className="text-sm text-aurora-muted">
          A route to a target career in stages. Earlier stages are careers closer to your current evidence whose missing skills also count towards the target.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (targetId) create.mutate(targetId);
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="transition-target" className={labelClass}>Target career</label>
          <select id="transition-target" value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${fieldClass} min-w-56`}>
            <option value="">Choose a career</option>
            {careers.map((career) => (
              <option key={career.id} value={career.id}>{career.title}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={primaryButton} disabled={!targetId || create.isPending}>
          {create.isPending ? 'Building...' : 'Build plan'}
        </button>
      </form>

      <ErrorNote message={create.isError ? errorText(create.error, 'The plan could not be built.') : remove.isError ? errorText(remove.error, 'The plan could not be removed.') : null} />

      {plans.isLoading && <Loading label="Loading your plans..." />}

      {plans.data && plans.data.length === 0 && (
        <EmptyState title="No transition plans yet">Choose a target career above to build a staged plan from the skills you have evidence for.</EmptyState>
      )}

      {plans.data?.map((plan) => (
        <article key={plan.id} className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-4" data-testid="transition-plan" aria-label={`Plan to ${plan.targetCareerTitle}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-aurora-ink flex flex-wrap items-center gap-1.5">
              {plan.stages.map((stage, index) => (
                <React.Fragment key={stage.careerId}>
                  {index > 0 && <ArrowRight className="w-3.5 h-3.5 text-aurora-muted" aria-hidden="true" />}
                  <span>{stage.careerTitle}</span>
                </React.Fragment>
              ))}
            </h3>
            <button type="button" className={quietButton} disabled={remove.isPending} onClick={() => remove.mutate(plan.id)}>Remove plan</button>
          </div>
          {plan.outdated && (
            <p className="text-xs text-amber-700" role="status">This plan was made with earlier scoring rules or career data. Build it again to refresh the figures.</p>
          )}
          <ol className="space-y-3">
            {plan.stages.map((stage) => (
              <li key={stage.careerId} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2" data-testid="transition-stage">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-aurora-ink flex items-center gap-1.5">
                    Stage {stage.order}: {stage.careerTitle}
                    {stage.reached && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-label="Reached" />}
                  </span>
                  <span className="text-xs text-aurora-muted">
                    Match now {stage.currentScore ?? stage.scoreAtCreation}% → {stage.projectedScore}% once this stage's skills are used in a project
                  </span>
                </div>
                <div className="space-y-1">
                  <span className={labelClass}>{stage.reached ? 'Skills this stage asked for' : `Skills to acquire (${stage.skillsStillMissing.length} left)`}</span>
                  <SkillChips skills={stage.reached ? stage.skillsToAcquire : stage.skillsStillMissing} tone={stage.reached ? 'good' : 'warn'} emptyText="No new skills needed for this stage" />
                </div>
              </li>
            ))}
          </ol>
          <Note>
            Built {formatDate(plan.createdAt)}. Projected scores assume each listed skill is used in one project; they are hypothetical and do not predict hiring outcomes.
            A stage is marked reached when your real resume evidence covers its skills.
          </Note>
        </article>
      ))}
    </section>
  );
};

export default TransitionPanel;
