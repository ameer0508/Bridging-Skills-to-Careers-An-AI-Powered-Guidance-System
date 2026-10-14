import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import {
  careerLabApi,
  STATUS_LABEL,
  type CareerOption,
  type CounterfactualResult,
  type ScenarioChange,
  type ScenarioChangeType,
  type WhatIfResult,
} from '../careerLabApi';
import { BeforeAfter, Delta, EmptyState, ErrorNote, Loading, Note } from '../../../design/aurora/labUi';
import { errorText, fieldClass, labelClass, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';

interface WhatIfPanelProps {
  careers: CareerOption[];
}

interface DraftChange {
  key: number;
  type: ScenarioChangeType;
  skill: string;
}

const CHANGE_LABEL: Record<ScenarioChangeType, string> = {
  add_project: 'Use it in a project',
  add_certification: 'Earn a certification in it',
  add_experience: 'Use it in a job or internship',
  add_skill: 'List it only',
  remove_skill: 'Remove it from my resume',
};

const toChange = (draft: DraftChange): ScenarioChange =>
  draft.type === 'add_skill' || draft.type === 'remove_skill'
    ? { type: draft.type, skill: draft.skill }
    : { type: draft.type, skills: [draft.skill] };

/**
 * Explains one career's score (what would raise it most) and lets the user try hypothetical
 * changes. Nothing entered here is saved or changes the user's real scores.
 */
export const WhatIfPanel: React.FC<WhatIfPanelProps> = ({ careers }) => {
  const [careerId, setCareerId] = useState<string>('');
  const [drafts, setDrafts] = useState<DraftChange[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [typeInput, setTypeInput] = useState<ScenarioChangeType>('add_project');
  const [nextKey, setNextKey] = useState(1);

  const counterfactuals = useQuery<CounterfactualResult>({
    queryKey: ['career-lab', 'counterfactuals', careerId],
    queryFn: () => careerLabApi.counterfactuals(careerId),
    enabled: Boolean(careerId),
  });

  const whatIf = useMutation<WhatIfResult, unknown, ScenarioChange[]>({ mutationFn: (changes) => careerLabApi.whatIf(changes) });

  const addDraft = (skill: string, type: ScenarioChangeType) => {
    const name = skill.trim();
    if (!name || drafts.length >= 10) return;
    setDrafts((current) => [...current, { key: nextKey, type, skill: name }]);
    setNextKey((n) => n + 1);
    setSkillInput('');
  };

  const explained = counterfactuals.data;
  const result = whatIf.data;
  const selectedResult = result?.careers.find((c) => c.careerId === careerId);

  return (
    <section className={panelClass} aria-labelledby="whatif-heading">
      <div className="space-y-1">
        <h2 id="whatif-heading" className="font-heading text-lg font-bold text-aurora-ink">What would change my score?</h2>
        <p className="text-sm text-aurora-muted">
          Pick a career to see which changes would raise your match score most, then try a scenario of your own.
        </p>
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <label htmlFor="whatif-career" className={labelClass}>Career</label>
        <select id="whatif-career" value={careerId} onChange={(e) => setCareerId(e.target.value)} className={fieldClass}>
          <option value="">Choose a career</option>
          {careers.map((career) => (
            <option key={career.id} value={career.id}>{career.title}</option>
          ))}
        </select>
      </div>

      {careerId && counterfactuals.isLoading && <Loading label="Working out what would change the score..." />}
      <ErrorNote message={counterfactuals.isError ? errorText(counterfactuals.error, 'The explanation could not be loaded.') : null} />

      {explained && (
        <div className="space-y-4" data-testid="counterfactuals">
          <p className="text-sm text-aurora-ink">
            Your current match with <span className="font-bold text-aurora-ink">{explained.careerTitle}</span> is{' '}
            <span className="font-bold text-aurora-ink" data-testid="counterfactual-baseline">{explained.baseline.score}%</span>
            {explained.baseline.missingRequired > 0 && <> with {explained.baseline.missingRequired} required skill{explained.baseline.missingRequired === 1 ? '' : 's'} missing</>}.
          </p>

          {explained.singleChanges.length === 0 ? (
            <EmptyState title="Nothing left to add">Every requirement of this career is already backed by a role or project on your resume.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[560px]">
                <caption className="text-left text-aurora-muted font-semibold pb-2">Single changes, most effective first</caption>
                <thead>
                  <tr className="text-aurora-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">Skill</th>
                    <th scope="col" className="py-2 px-3 font-semibold">Now</th>
                    <th scope="col" className="py-2 px-3 font-semibold">Change</th>
                    <th scope="col" className="py-2 px-3 font-semibold">Score would be</th>
                    <th scope="col" className="py-2 pl-3 font-semibold"><span className="sr-only">Add to scenario</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aurora-line text-aurora-ink">
                  {explained.singleChanges.slice(0, 8).map((change) => (
                    <tr key={change.skillName} data-testid="counterfactual-row">
                      <th scope="row" className="py-2 pr-3 font-bold text-aurora-ink">
                        {change.skillName}
                        <span className="block font-normal text-aurora-muted">{change.importance}</span>
                      </th>
                      <td className="py-2 px-3">{STATUS_LABEL[change.currentStatus] || change.currentStatus}</td>
                      <td className="py-2 px-3">{change.action}</td>
                      <td className="py-2 px-3">
                        {change.scoreAfter}% (<Delta value={change.scoreDelta} />)
                      </td>
                      <td className="py-2 pl-3">
                        <button type="button" className={quietButton} onClick={() => addDraft(change.skillName, 'add_project')} aria-label={`Add ${change.skillName} to the scenario`}>
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {explained.pathToTarget.steps.length > 0 && (
            <div className="space-y-2" data-testid="counterfactual-path">
              <p className="text-xs font-semibold text-aurora-muted">
                Shortest route found to {explained.pathToTarget.targetScore}%:{' '}
                {explained.pathToTarget.reached ? `reached at ${explained.pathToTarget.finalScore}%` : `not reachable; these steps get to ${explained.pathToTarget.finalScore}%`}
              </p>
              <ol className="space-y-1 text-xs text-aurora-ink list-decimal list-inside">
                {explained.pathToTarget.steps.map((step) => (
                  <li key={step.step}>
                    <span className="font-bold text-aurora-ink">{step.skillName}</span>: {step.action.toLowerCase()} → {step.scoreAfter}% (<Delta value={step.scoreDelta} />)
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Note>{explained.assumption} {explained.note}</Note>
        </div>
      )}

      <div className="pt-4 border-t border-aurora-line space-y-4">
        <h3 className="text-sm font-bold text-aurora-ink">Try a scenario</h3>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            addDraft(skillInput, typeInput);
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="scenario-skill" className={labelClass}>Skill</label>
            <input id="scenario-skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} maxLength={80} placeholder="e.g. Docker" className={`${fieldClass} w-48`} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="scenario-type" className={labelClass}>What if I</label>
            <select id="scenario-type" value={typeInput} onChange={(e) => setTypeInput(e.target.value as ScenarioChangeType)} className={fieldClass}>
              {(Object.keys(CHANGE_LABEL) as ScenarioChangeType[]).map((type) => (
                <option key={type} value={type}>{CHANGE_LABEL[type]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className={quietButton} disabled={!skillInput.trim() || drafts.length >= 10}>Add to scenario</button>
        </form>

        {drafts.length > 0 && (
          <ul className="space-y-1.5" data-testid="scenario-changes">
            {drafts.map((draft) => (
              <li key={draft.key} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink">
                <span><span className="font-bold text-aurora-ink">{draft.skill}</span>: {CHANGE_LABEL[draft.type].toLowerCase()}</span>
                <button type="button" onClick={() => setDrafts((current) => current.filter((d) => d.key !== draft.key))} aria-label={`Remove ${draft.skill} from the scenario`} className="text-aurora-muted hover:text-aurora-indigo cursor-pointer">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={primaryButton} disabled={drafts.length === 0 || whatIf.isPending} onClick={() => whatIf.mutate(drafts.map(toChange))}>
            {whatIf.isPending ? 'Calculating...' : 'Run scenario'}
          </button>
          {drafts.length > 0 && (
            <button type="button" className={quietButton} onClick={() => { setDrafts([]); whatIf.reset(); }}>Clear</button>
          )}
        </div>

        <ErrorNote message={whatIf.isError ? errorText(whatIf.error, 'The scenario could not be calculated.') : null} />

        {result && (
          <div className="space-y-4" data-testid="whatif-result">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800" data-testid="whatif-hypothetical-label">Hypothetical result. Nothing was saved and your real scores are unchanged.</p>

            <div className="grid gap-3 md:grid-cols-2" data-testid="whatif-transitions">
              {[...result.careers]
                .sort((a, b) => (a.careerId === careerId ? -1 : b.careerId === careerId ? 1 : b.scoreDelta - a.scoreDelta))
                .slice(0, 4)
                .map((career) => (
                  <div key={career.careerId} className="rounded-2xl border border-aurora-line bg-aurora-canvas/50 p-3.5">
                    <p className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-aurora-ink">
                      <span className="truncate">{career.careerTitle}</span>
                      <Delta value={career.scoreDelta} />
                    </p>
                    <BeforeAfter before={career.scoreBefore} after={career.scoreAfter} label={`${career.careerTitle} match`} />
                  </div>
                ))}
            </div>

            {selectedResult && selectedResult.requirementChanges.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[520px]">
                  <caption className="text-left text-aurora-muted font-semibold pb-2">
                    {selectedResult.careerTitle}: {selectedResult.scoreBefore}% → {selectedResult.scoreAfter}% (<Delta value={selectedResult.scoreDelta} />)
                  </caption>
                  <thead>
                    <tr className="text-aurora-muted">
                      <th scope="col" className="py-2 pr-3 font-semibold">Requirement</th>
                      <th scope="col" className="py-2 px-3 font-semibold">Before</th>
                      <th scope="col" className="py-2 px-3 font-semibold">After</th>
                      <th scope="col" className="py-2 px-3 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-aurora-line text-aurora-ink">
                    {selectedResult.requirementChanges.map((row) => (
                      <tr key={row.skillName}>
                        <th scope="row" className="py-2 pr-3 font-bold text-aurora-ink">{row.skillName}</th>
                        <td className="py-2 px-3">{STATUS_LABEL[row.statusBefore] || row.statusBefore}</td>
                        <td className="py-2 px-3">{STATUS_LABEL[row.statusAfter] || row.statusAfter}</td>
                        <td className="py-2 px-3">{row.pointsBefore} → {row.pointsAfter} of {row.pointsPossible} (<Delta value={row.pointsDelta} />)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[420px]">
                <caption className="text-left text-aurora-muted font-semibold pb-2">Effect on every career</caption>
                <thead>
                  <tr className="text-aurora-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">Career</th>
                    <th scope="col" className="py-2 px-3 font-semibold">Now</th>
                    <th scope="col" className="py-2 px-3 font-semibold">In this scenario</th>
                    <th scope="col" className="py-2 px-3 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aurora-line text-aurora-ink">
                  {result.careers.map((career) => (
                    <tr key={career.careerId} data-testid="whatif-career-row">
                      <th scope="row" className="py-2 pr-3 font-bold text-aurora-ink">{career.careerTitle}</th>
                      <td className="py-2 px-3">{career.scoreBefore}%</td>
                      <td className="py-2 px-3">{career.scoreAfter}%</td>
                      <td className="py-2 px-3"><Delta value={career.scoreDelta} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>{result.note}</Note>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhatIfPanel;
