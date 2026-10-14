export interface Range {
  low: number;
  high: number;
}

/** "about 7 weeks" or "7 to 18 weeks"; hours likewise. */
export const rangeText = (range: Range, unit: string): string =>
  range.low === range.high ? `about ${range.low} ${unit}${range.low === 1 ? '' : 's'}` : `${range.low} to ${range.high} ${unit}s`;
