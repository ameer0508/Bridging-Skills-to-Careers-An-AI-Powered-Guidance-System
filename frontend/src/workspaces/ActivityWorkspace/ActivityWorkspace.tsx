import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import apiClient from '../../lib/axios';
import { EmptyState, ErrorNote, Loading, Note } from '../../design/aurora/labUi';
import { errorText, formatDate, formatDateTime, labelClass, panelClass, quietButton } from '../../design/aurora/labStyles';

/** Shapes mirror backend/src/services/LearningActivityService.ts. */
interface Activity {
  streak: { current: number; currentStartedOn: string | null; longest: number; activeToday: boolean; lastActiveOn: string | null; activeDaysLast30: number };
  recent: Array<{ at: string; type: string; label: string }>;
  notifications: Array<{ id: string; kind: 'milestone' | 'reminder'; title: string; body: string; link: string; read: boolean; at: string }>;
  unreadCount: number;
  preferences: { reminders: boolean; milestoneNotifications: boolean };
  policy: { streakMilestones: number[]; inactiveDays: number; stalledDays: number };
  note: string;
}

export const ACTIVITY_QUERY_KEY = ['activity'] as const;

const days = (n: number): string => `${n} day${n === 1 ? '' : 's'}`;

/** Learning streak, recent recorded activity and in-app notifications with their opt-in switches. */
export const ActivityWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const activity = useQuery<Activity>({ queryKey: ACTIVITY_QUERY_KEY, queryFn: async () => (await apiClient.get('/activity')).data.data });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEY });

  const setPreference = useMutation<unknown, unknown, Record<string, boolean>>({
    mutationFn: (body) => apiClient.put('/users/me/learning-preferences', body),
    onSuccess: refresh,
  });
  const act = useMutation<unknown, unknown, { method: 'post' | 'delete'; path: string }>({
    mutationFn: ({ method, path }) => apiClient[method](path),
    onSuccess: refresh,
  });

  const header = (
    <header className="flex items-start gap-4 p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60">
      <div className="w-12 h-12 rounded-2xl bg-aurora-canvas border border-aurora-line flex items-center justify-center text-amber-700 shrink-0">
        <Flame className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-aurora-ink tracking-tight">Learning activity</h1>
        <p className="text-xs text-aurora-muted max-w-2xl">Your streak from what SkillBridge has recorded you doing, and notifications you can switch on. Nothing is sent outside the app.</p>
      </div>
    </header>
  );

  if (activity.isLoading) {
    return <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">{header}<section className={panelClass}><Loading label="Loading your activity..." /></section></div>;
  }
  if (activity.isError || !activity.data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
        {header}
        <section className={panelClass}>
          <ErrorNote message={errorText(activity.error, 'Your activity could not be loaded.')} />
          <button type="button" className={quietButton} onClick={() => activity.refetch()}>Try again</button>
        </section>
      </div>
    );
  }

  const { streak, recent, notifications, unreadCount, preferences, policy, note } = activity.data;
  const failed = setPreference.error || act.error;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
      {header}

      <section className={panelClass} aria-labelledby="streak-heading" data-testid="streak" data-current={streak.current}>
        <h2 id="streak-heading" className="text-base font-bold text-aurora-ink">Streak</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
            <dt className={labelClass}>Current streak</dt>
            <dd className="text-xl font-extrabold text-aurora-ink">{days(streak.current)}</dd>
          </div>
          <div className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
            <dt className={labelClass}>Longest streak</dt>
            <dd className="text-xl font-extrabold text-aurora-ink">{days(streak.longest)}</dd>
          </div>
          <div className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
            <dt className={labelClass}>Active in the last 30 days</dt>
            <dd className="text-xl font-extrabold text-aurora-ink">{days(streak.activeDaysLast30)}</dd>
          </div>
        </dl>
        <p className="text-xs text-aurora-muted">
          {streak.lastActiveOn === null
            ? 'No learning activity has been recorded yet.'
            : streak.activeToday
              ? 'Activity is recorded for today.'
              : streak.current > 0
                ? `Last activity ${formatDate(streak.lastActiveOn)}. Do something today to keep the streak.`
                : `Last activity ${formatDate(streak.lastActiveOn)}.`}
        </p>
        <div className="space-y-2">
          <h3 className={labelClass}>Recent activity</h3>
          {recent.length === 0 ? (
            <p className="text-xs text-aurora-muted">Nothing yet. Finishing a roadmap item or taking a skill check counts.</p>
          ) : (
            <ul className="space-y-1" data-testid="recent-activity">
              {recent.map((event) => (
                <li key={`${event.at}-${event.type}`} className="text-xs text-aurora-muted flex flex-wrap gap-x-3">
                  <span className="text-aurora-muted">{formatDateTime(event.at)}</span>
                  <span>{event.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Note testId="activity-note">{note}</Note>
      </section>

      <section className={panelClass} aria-labelledby="notification-settings-heading">
        <h2 id="notification-settings-heading" className="text-base font-bold text-aurora-ink">Notification settings</h2>
        <p className="text-xs text-aurora-muted">Both are off until you switch them on. They appear only on this page and on the bell at the top; no e-mail, SMS or push message is ever sent.</p>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-xs text-aurora-ink cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#5540f5]" checked={preferences.milestoneNotifications} disabled={setPreference.isPending} onChange={(e) => setPreference.mutate({ milestoneNotifications: e.target.checked })} />
            <span>Milestones: a passed skill check, a finished roadmap phase, a completed practice project, a streak of {policy.streakMilestones.join(', ')} days</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-aurora-ink cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#5540f5]" checked={preferences.reminders} disabled={setPreference.isPending} onChange={(e) => setPreference.mutate({ reminders: e.target.checked })} />
            <span>Reminders: after {policy.inactiveDays} days without recorded activity, or when a roadmap item has been in progress for {policy.stalledDays} days</span>
          </label>
        </div>
      </section>

      <section className={panelClass} aria-labelledby="notifications-heading" data-testid="notifications" data-unread={unreadCount}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="notifications-heading" className="text-base font-bold text-aurora-ink">Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}</h2>
          {notifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={quietButton} disabled={act.isPending || unreadCount === 0} onClick={() => act.mutate({ method: 'post', path: '/activity/notifications/read-all' })}>Mark all read</button>
              <button type="button" className={quietButton} disabled={act.isPending} onClick={() => act.mutate({ method: 'delete', path: '/activity/notifications' })}>Dismiss all</button>
            </div>
          )}
        </div>
        <ErrorNote message={failed ? errorText(failed, 'That change could not be saved.') : null} />
        {notifications.length === 0 ? (
          <EmptyState title="No notifications">
            {preferences.reminders || preferences.milestoneNotifications ? 'Nothing to tell you right now.' : 'Notifications are switched off. Switch a kind on above if you want them.'}
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`p-3 rounded-2xl border space-y-1 ${n.read ? 'bg-aurora-canvas/60 border-aurora-line' : 'bg-aurora-violet/[0.06] border-aurora-violet/25'}`} data-testid="notification" data-kind={n.kind} data-read={n.read}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-aurora-ink">{n.title}{n.read ? '' : ' (unread)'}</span>
                  <span className="text-[11px] text-aurora-muted">{n.kind === 'milestone' ? 'Milestone' : 'Reminder'}, {formatDateTime(n.at)}</span>
                </div>
                <p className="text-xs text-aurora-muted">{n.body}</p>
                <div className="flex flex-wrap gap-2">
                  {n.link && <Link to={n.link} className={quietButton}>Open</Link>}
                  {!n.read && <button type="button" className={quietButton} disabled={act.isPending} aria-label={`Mark read: ${n.title}`} onClick={() => act.mutate({ method: 'post', path: `/activity/notifications/${n.id}/read` })}>Mark read</button>}
                  <button type="button" className={quietButton} disabled={act.isPending} aria-label={`Dismiss: ${n.title}`} onClick={() => act.mutate({ method: 'delete', path: `/activity/notifications/${n.id}` })}>Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

ActivityWorkspace.displayName = 'ActivityWorkspace';
export default ActivityWorkspace;
