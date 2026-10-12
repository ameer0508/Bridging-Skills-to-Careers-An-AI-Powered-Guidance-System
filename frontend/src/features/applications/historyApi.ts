import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/applications/ApplicationHistoryService.ts (X8). */
export type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
export type EventStatus = Exclude<ApplicationStatus, 'saved'>;

export const EVENT_STATUSES: EventStatus[] = ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export interface TimelineEvent {
  id: string | null;
  status: ApplicationStatus;
  occurredAt: string;
  origin: 'recorded' | 'inferred';
  dateSource: 'recorded_at_change' | 'user_stated' | 'inferred';
  recordedAt: string | null;
  editedAt: string | null;
  note: string;
  removable: boolean;
  explanation?: string;
}

export interface ApplicationSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  applicationUrl: string;
  provider: string;
  isSample: boolean;
  isManual: boolean;
  status: ApplicationStatus;
  applied: boolean;
  appliedAt: string | null;
  lastEventAt: string | null;
  savedAt: string;
  reminder: { at: string; note: string; due: boolean } | null;
}

export interface ApplicationHistory {
  application: ApplicationSummary;
  timeline: TimelineEvent[];
  notes: string[];
}

export async function fetchApplications(): Promise<ApplicationSummary[]> {
  const res = await apiClient.get('/applications');
  return res.data.data.applications as ApplicationSummary[];
}

export async function fetchApplicationHistory(id: string): Promise<ApplicationHistory> {
  const res = await apiClient.get(`/applications/${encodeURIComponent(id)}/history`);
  return res.data.data as ApplicationHistory;
}

/**
 * A date input (YYYY-MM-DD) as noon UTC, so the stored UTC day is the day chosen; never later than
 * now, because events cannot be dated in the future.
 */
export const dayToIso = (day: string) => {
  const noon = new Date(`${day}T12:00:00.000Z`);
  return new Date(Math.min(noon.getTime(), Date.now())).toISOString();
};

/** Today as YYYY-MM-DD in the user's own timezone, for date inputs. */
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function addApplicationEvent(id: string, body: { status: EventStatus; occurredAt?: string; note?: string }): Promise<ApplicationHistory> {
  const res = await apiClient.post(`/applications/${encodeURIComponent(id)}/events`, body);
  return res.data.data as ApplicationHistory;
}

export async function correctApplicationEvent(id: string, eventId: string, body: { occurredAt?: string; note?: string }): Promise<ApplicationHistory> {
  const res = await apiClient.patch(`/applications/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}`, body);
  return res.data.data as ApplicationHistory;
}

export async function removeApplicationEvent(id: string, eventId: string): Promise<ApplicationHistory> {
  const res = await apiClient.delete(`/applications/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}`);
  return res.data.data as ApplicationHistory;
}

export async function setApplicationReminder(id: string, body: { at: string | null; note?: string }): Promise<ApplicationHistory> {
  const res = await apiClient.put(`/applications/${encodeURIComponent(id)}/reminder`, body);
  return res.data.data as ApplicationHistory;
}

export async function createManualApplication(body: {
  title: string;
  company: string;
  location?: string;
  applicationUrl?: string;
  appliedAt?: string;
  note?: string;
}): Promise<ApplicationHistory> {
  const res = await apiClient.post('/applications/manual', body);
  return res.data.data as ApplicationHistory;
}
