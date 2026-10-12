import React from 'react';
import { InterviewRubric, useInterviewRubrics } from '../rubricsApi';

const DIMENSION_LABELS: Array<[keyof InterviewRubric['ai'], string]> = [
  ['relevance', 'Relevance'],
  ['completeness', 'Completeness'],
  ['specificity', 'Specificity'],
  ['structure', 'Structure'],
  ['technicalAccuracy', 'Technical accuracy (AI scoring only)'],
];

const WeightsTable: React.FC<{ rubric: InterviewRubric }> = ({ rubric }) => (
  <table className="mt-2 w-full text-left text-[11px] text-slate-300" data-testid="rubric-weights">
    <caption className="sr-only">Weights of the {rubric.label} rubric</caption>
    <thead>
      <tr className="text-slate-400"><th scope="col" className="py-0.5 pr-3 font-medium">Dimension</th><th scope="col" className="py-0.5 pr-3 font-medium">Rule-based</th><th scope="col" className="py-0.5 font-medium">AI</th></tr>
    </thead>
    <tbody>
      {DIMENSION_LABELS.map(([key, label]) => (
        <tr key={key}>
          <th scope="row" className="py-0.5 pr-3 font-normal">{label}</th>
          <td className="py-0.5 pr-3">{key === 'technicalAccuracy' ? 'not judged' : `${Math.round(rubric.heuristic[key as keyof InterviewRubric['heuristic']] * 100)}%`}</td>
          <td className="py-0.5">{rubric.ai[key]}%</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/** Lets the user keep the rubric matched to the role ("auto") or pick another. */
export const RubricPicker: React.FC<{ roleTitle: string; value: string; onChange: (id: string) => void }> = ({ roleTitle, value, onChange }) => {
  const query = useInterviewRubrics(roleTitle);
  if (!query.data) return null;
  const { rubrics, resolved: autoId } = query.data;
  const effective = rubrics.find(r => r.id === (value || autoId)) ?? rubrics[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-xs text-slate-300" data-testid="rubric-picker">
      <label className="flex flex-col gap-1 font-semibold text-slate-200">
        Scoring rubric
        <select
          className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Match my role ({rubrics.find(r => r.id === autoId)?.label ?? 'General'})</option>
          {rubrics.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </label>
      <p className="mt-2 text-slate-400">{effective.emphasis}</p>
      <details className="mt-1">
        <summary className="cursor-pointer text-slate-400">How each dimension is weighted</summary>
        <WeightsTable rubric={effective} />
        <p className="mt-1 text-slate-500">The limits for short, off-topic or unverified answers are the same for every rubric.</p>
      </details>
    </div>
  );
};

/** States which rubric a session was scored with. Sessions from before rubrics were scored with General. */
export const RubricNote: React.FC<{ rubricId?: string | null }> = ({ rubricId }) => {
  const rubrics = useInterviewRubrics();
  const rubric = rubrics.data?.rubrics.find(r => r.id === (rubricId || 'general'));
  if (!rubric) return null;
  return (
    <div className="text-xs text-slate-400" data-testid="rubric-note" data-rubric={rubric.id}>
      Scored with the <span className="font-semibold text-slate-200">{rubric.label}</span> rubric (version {rubric.version}). {rubric.emphasis}
      <details className="mt-1">
        <summary className="cursor-pointer">Weights</summary>
        <WeightsTable rubric={rubric} />
      </details>
    </div>
  );
};
