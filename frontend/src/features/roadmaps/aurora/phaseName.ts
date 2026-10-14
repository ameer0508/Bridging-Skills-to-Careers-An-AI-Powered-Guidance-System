/** Stored phase titles often begin "Phase 2: ...", which the page already shows as a label. */
export const phaseName = (title: string) => title.replace(/^phase\s+\d+\s*[:\-–]\s*/i, '');
