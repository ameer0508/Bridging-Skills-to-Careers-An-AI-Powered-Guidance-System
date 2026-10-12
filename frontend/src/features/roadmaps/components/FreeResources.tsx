import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { EmptyState, ErrorNote, Loading, Note } from '../../careerLab/components/labUi';
import { errorText, labelClass, panelClass, quietButton } from '../../careerLab/components/labStyles';

/** Shapes mirror backend/src/services/LearningResourceService.ts. */
type MyStatus = 'saved' | 'done' | null;
interface Resource {
  id: string;
  title: string;
  provider: string;
  host: string;
  url: string;
  type: string;
  difficulty: string;
  cost: string;
  myStatus: MyStatus;
}
interface ResourceResult {
  hasProfile: boolean;
  career: { id: string; title: string } | null;
  groups: Array<{ skill: string; importance: string; currentStatus: string; resources: Resource[] }>;
  withoutResources: string[];
  coverage: { gapSkills: number; withResources: number };
  catalogue: { resources: number; skillsCovered: number };
  note: string;
}

/** Free third-party resources for the skills still to be shown for one career. */
export const FreeResourcesPanel: React.FC<{ careerId: string }> = ({ careerId }) => {
  const queryClient = useQueryClient();
  const resources = useQuery<ResourceResult>({
    queryKey: ['learning-resources', careerId],
    queryFn: async () => (await apiClient.get('/learning-resources', { params: { careerId } })).data.data,
  });
  const mark = useMutation<unknown, unknown, { id: string; status: MyStatus }>({
    mutationFn: ({ id, status }) => apiClient.put(`/learning-resources/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning-resources'] }),
  });

  const heading = (
    <div className="flex items-start gap-3">
      <BookOpen className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <h2 id="free-resources-heading" className="text-base font-bold text-white">Free resources for your gaps</h2>
        <p className="text-xs text-slate-400">Official documentation and first-party tutorials on other sites, listed for the skills you have not yet shown in use.</p>
      </div>
    </div>
  );

  if (resources.isLoading) {
    return <section className={panelClass}><Loading label="Loading resources..." /></section>;
  }
  if (resources.isError || !resources.data) {
    return (
      <section className={panelClass} aria-labelledby="free-resources-heading">
        {heading}
        <ErrorNote message={errorText(resources.error, 'Resources could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => resources.refetch()}>Try again</button>
      </section>
    );
  }

  const data = resources.data;
  return (
    <section className={panelClass} aria-labelledby="free-resources-heading" data-testid="free-resources">
      {heading}
      <ErrorNote message={mark.isError ? errorText(mark.error, 'Your mark could not be saved.') : null} />

      {!data.hasProfile ? (
        <EmptyState title="No resources yet">Resources are listed for the gaps between your evidence and a career. Upload a resume first.</EmptyState>
      ) : data.groups.length === 0 ? (
        <EmptyState title="Nothing in the catalogue for these gaps">The catalogue has no resource for the skills still open for this career.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {data.groups.map((group) => (
            <li key={group.skill} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2" data-testid="resource-group" data-skill={group.skill}>
              <h3 className="text-sm font-bold text-white">{group.skill} <span className="text-[11px] font-normal text-slate-400">({group.importance})</span></h3>
              <ul className="space-y-2">
                {group.resources.map((resource) => (
                  <li key={resource.id} className="space-y-1" data-testid="resource" data-status={resource.myStatus ?? 'none'}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-cyan-300 underline">
                      {resource.title} (opens {resource.host} in a new tab)
                    </a>
                    <p className="text-[11px] text-slate-400">
                      {resource.provider}, {resource.type.toLowerCase()}, {resource.difficulty.toLowerCase()}. Third-party site. {resource.cost}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={quietButton}
                        disabled={mark.isPending}
                        aria-pressed={resource.myStatus === 'saved'}
                        aria-label={`${resource.myStatus === 'saved' ? 'Remove from saved' : 'Save for later'}: ${resource.title}`}
                        onClick={() => mark.mutate({ id: resource.id, status: resource.myStatus === 'saved' ? null : 'saved' })}
                      >
                        {resource.myStatus === 'saved' ? 'Saved' : 'Save for later'}
                      </button>
                      <button
                        type="button"
                        className={quietButton}
                        disabled={mark.isPending}
                        aria-pressed={resource.myStatus === 'done'}
                        aria-label={`${resource.myStatus === 'done' ? 'Unmark as worked through' : 'Mark as worked through'}: ${resource.title}`}
                        onClick={() => mark.mutate({ id: resource.id, status: resource.myStatus === 'done' ? null : 'done' })}
                      >
                        {resource.myStatus === 'done' ? 'Worked through (your note)' : 'I worked through this'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {data.hasProfile && data.withoutResources.length > 0 && (
        <div className="space-y-1" data-testid="resources-missing">
          <h3 className={labelClass}>No resource in the catalogue</h3>
          <p className="text-xs text-slate-300">{data.withoutResources.join(', ')}. These are still gaps; the catalogue simply has nothing listed for them.</p>
        </div>
      )}

      <Note testId="free-resources-note">
        {data.note} The catalogue holds {data.catalogue.resources} links covering {data.catalogue.skillsCovered} skills. No ratings, durations or prices are shown because none are known.
      </Note>
    </section>
  );
};

export default FreeResourcesPanel;
