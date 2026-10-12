/**
 * Zero-cost provider policy for the backend (docs/ZERO_COST_API_POLICY.md).
 *
 * Mirrors the backend's entries in ai/app/cost_policy/provider_registry.json, which is the
 * source of truth; tests/cost_policy.test.ts fails if the two drift apart. Fails closed: an
 * unknown, unverified or blocked provider, or a missing flag or credential, refuses the call.
 */

export type ProviderStatus = 'APPROVED' | 'CONDITIONAL' | 'UNVERIFIED' | 'BLOCKED';

export type DenyReason =
  | 'unknown_provider'
  | 'blocked'
  | 'unverified'
  | 'not_enabled'
  | 'not_attested'
  | 'missing_credentials';

interface ProviderEntry {
  status: ProviderStatus;
  credentialEnv: string[];
  enableEnv?: string;
  attestationEnv?: string[];
}

export const BACKEND_PROVIDERS: Record<string, ProviderEntry> = {
  jsearch: {
    status: 'UNVERIFIED',
    credentialEnv: ['RAPIDAPI_KEY', 'JSEARCH_API_KEY'],
    enableEnv: 'SKILLBRIDGE_ENABLE_JSEARCH',
  },
};

export interface CostDecision {
  provider: string;
  allowed: boolean;
  reason?: DenyReason;
  message: string;
}

type EnvLike = Record<string, string | undefined>;

const isTrue = (value: string | undefined) => ['1', 'true', 'yes'].includes((value ?? '').trim().toLowerCase());

export function checkLiveCall(provider: string, envObj: EnvLike = process.env): CostDecision {
  const entry = BACKEND_PROVIDERS[provider];
  const deny = (reason: DenyReason, message: string): CostDecision => ({ provider, allowed: false, reason, message });

  if (!entry) return deny('unknown_provider', 'Provider is not in the zero-cost registry.');
  if (entry.status === 'BLOCKED') return deny('blocked', 'Blocked by the zero-cost policy.');
  if (entry.status === 'UNVERIFIED') {
    return deny('unverified', 'Free access has not been verified from official terms, so live calls are off.');
  }
  if (!entry.enableEnv || !isTrue(envObj[entry.enableEnv])) {
    return deny('not_enabled', `External provider is off; the operator must set ${entry.enableEnv ?? 'its enable flag'}=true.`);
  }
  const missingAttestations = (entry.attestationEnv ?? []).filter(name => !isTrue(envObj[name]));
  if (entry.status === 'CONDITIONAL' && missingAttestations.length > 0) {
    return deny('not_attested', `Operator has not confirmed the free-tier conditions (${missingAttestations.join(', ')}).`);
  }
  if (entry.credentialEnv.length > 0 && !entry.credentialEnv.some(name => envObj[name])) {
    return deny('missing_credentials', `No credential configured (${entry.credentialEnv.join(' / ')}).`);
  }
  return { provider, allowed: true, message: 'Cleared by the zero-cost policy.' };
}

export class ProviderBlockedError extends Error {
  constructor(public readonly decision: CostDecision) {
    super(`Live call to '${decision.provider}' refused (${decision.reason}): ${decision.message}`);
    this.name = 'ProviderBlockedError';
  }
}

/** `fetch`, but only after the policy clears the provider. A refusal never reaches the network. */
export async function guardedFetch(
  provider: string,
  url: string,
  init?: Parameters<typeof fetch>[1],
  envObj: EnvLike = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const decision = checkLiveCall(provider, envObj);
  if (!decision.allowed) throw new ProviderBlockedError(decision);
  return fetchImpl(url, init);
}

/** Replaces every configured credential value in text bound for logs or responses. */
export function redactSecrets(text: string, envObj: EnvLike = process.env): string {
  const names = new Set<string>(['INTERNAL_SERVICE_KEY', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']);
  Object.values(BACKEND_PROVIDERS).forEach(entry => entry.credentialEnv.forEach(name => names.add(name)));
  const values = [...names]
    .map(name => envObj[name] ?? '')
    .filter(value => value.length >= 4)
    .sort((a, b) => b.length - a.length);
  return values.reduce((out, value) => out.split(value).join('[REDACTED]'), text);
}
