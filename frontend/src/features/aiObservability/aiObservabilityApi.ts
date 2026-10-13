import apiClient from '../../lib/axios';

/** Mirrors ai/app/observability/audit.py and ai/app/routers/observability.py (X11). */
export interface ProviderStats {
  attempts: number;
  successes: number;
  failures: Record<string, number>;
  policyRefusals: Record<string, number>;
  rateLimited: number;
  quotaPauses: number;
  lastFailureAt: string | null;
  latencyMs: { p50: number | null; p95: number | null; samples: number };
  failureRate: number | null;
}

export interface ServiceStats {
  requests: number;
  successes: number;
  allFailed: number;
  noProvider: number;
  cacheHits: number;
  fallbacks: number;
}

export interface Scope {
  source: 'memory' | 'files';
  coverage: string;
  instanceId: string;
  processStartedAt: string;
  writeFailures: number;
}

export interface Summary {
  windowHours: number;
  events: number;
  providers: Record<string, ProviderStats>;
  services: Record<string, ServiceStats>;
  retentionDays: number;
  persisted: boolean;
  scope?: Scope;
}

export interface AuditEvent {
  at: string;
  kind: string;
  service: string;
  provider: string | null;
  reason: string | null;
  attempt: number | null;
  latency_ms: number | null;
  personal_data: boolean;
  skipped: Record<string, string>;
}

export interface ProviderPolicy {
  provider: string;
  status: string;
  available: boolean;
  personalData: { allowed: boolean; reason: string | null };
  nonPersonalData: { allowed: boolean; reason: string | null };
  quotaRemaining: number | null;
}

export const fetchSummary = async (windowHours: number) =>
  (await apiClient.get('/ai-observability/summary', { params: { windowHours } })).data.data as Summary;
export const fetchEvents = async (windowHours: number) =>
  (await apiClient.get('/ai-observability/events', { params: { windowHours, limit: 100 } })).data.data as { events: AuditEvent[]; retentionDays: number };
export const fetchProviders = async () =>
  (await apiClient.get('/ai-observability/providers')).data.data as { providers: ProviderPolicy[] };
