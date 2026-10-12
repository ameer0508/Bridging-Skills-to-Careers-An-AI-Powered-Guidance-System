/**
 * Shape of GET /api/v1/readiness and helpers for reading it.
 * The endpoint returns `{ readiness: ReadinessRecord[] }`, sorted with the strongest career first.
 * Pages previously read fields such as `data.overallScore` that never existed, so they all
 * showed 0%; every page should go through these helpers instead.
 */
export interface ReadinessGapItem {
  skillName: string;
  impactScore: number;
  reason: string;
}

export interface ReadinessRecord {
  _id: string;
  careerId: { _id: string; title: string; category?: string; description?: string } | null;
  overallScore: number;
  readinessTier: string;
  /** Plain-language explanation, including that the score is not a hiring prediction. */
  interpretation?: string;
  dimensions: Array<{ name: string; score: number; weight: number }>;
  gaps: {
    criticalGaps: ReadinessGapItem[];
    weakAreas: ReadinessGapItem[];
    strengthAreas: ReadinessGapItem[];
  };
}

/** Accepts the API payload (or an already unwrapped list) and returns the records. */
export const toReadinessList = (payload: unknown): ReadinessRecord[] => {
  if (Array.isArray(payload)) return payload as ReadinessRecord[];
  const list = (payload as { readiness?: unknown } | null | undefined)?.readiness;
  return Array.isArray(list) ? (list as ReadinessRecord[]) : [];
};

/** The readiness record for a given career, or the user's strongest one. */
export const primaryReadiness = (payload: unknown, careerId?: string | null): ReadinessRecord | null => {
  const list = toReadinessList(payload);
  if (careerId) {
    const match = list.find((r) => r.careerId?._id === careerId);
    if (match) return match;
  }
  return list[0] ?? null;
};

/** Score (0-100) of a named dimension of the primary record, or null when not evaluated. */
export const dimensionScore = (payload: unknown, name: string): number | null =>
  primaryReadiness(payload)?.dimensions.find((d) => d.name === name)?.score ?? null;

export const readinessStrengths = (payload: unknown): ReadinessGapItem[] =>
  primaryReadiness(payload)?.gaps?.strengthAreas ?? [];

export const readinessGaps = (payload: unknown): ReadinessGapItem[] =>
  primaryReadiness(payload)?.gaps?.criticalGaps ?? [];
