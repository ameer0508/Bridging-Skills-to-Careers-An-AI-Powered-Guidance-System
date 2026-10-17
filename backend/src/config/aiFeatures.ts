/**
 * Experimental local-AI wording of explanations (career match, readiness, skill gaps, next action).
 *
 * Off unless ENABLE_LOCAL_AI_EXPLANATIONS is "true" (or 1/on/yes). The local model can state
 * plausible but wrong conclusions that pattern checks cannot catch (docs/AI_EXPLANATIONS.md), so the
 * verified, rule-based summaries are always shown and AI wording is opt-in. Enforced on the server:
 * while off, no explanation is generated and no saved AI text is returned, whatever the client asks.
 * Read on every request, so a change takes effect without a restart in tests.
 */
export function localAiExplanationsEnabled(): boolean {
  return ['1', 'true', 'on', 'yes'].includes((process.env.ENABLE_LOCAL_AI_EXPLANATIONS || '').trim().toLowerCase());
}
