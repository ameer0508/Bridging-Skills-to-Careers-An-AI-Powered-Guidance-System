import { SYNTHETIC_FIXTURE_SOURCE } from '../config/marketSources.js';
import type { ImportRequest } from '../services/market/MarketIngestionService.js';

/**
 * Deterministic SYNTHETIC postings for exercising the market pipeline and screens. Employers are
 * named "Fixture Employer N" and every record is stored with dataset "synthetic_fixture", which
 * the market screens label as test data. Nothing here describes a real job.
 *
 * Built in a known shape so tests can check it: monthly volume rises steadily for Python,
 * React and Docker, Kubernetes appears only in the last three months (too few postings), and
 * the batch also carries one cross-posted duplicate, one undated posting and one invalid record.
 */

const ROLES = [
  { title: 'Backend Developer', text: 'Build REST services with Python, Django and PostgreSQL. Docker and Git daily.' },
  { title: 'Frontend Developer', text: 'Ship user interfaces with React, TypeScript, HTML and CSS.' },
  { title: 'Data Analyst', text: 'Analyse data with Python, SQL and Excel; build dashboards in Power BI.' },
  { title: 'DevOps Engineer', text: 'Automate deployments with Docker, Linux and GitHub Actions.' },
];

const CITIES = [
  { location: 'Bengaluru, Karnataka', country: 'IN', currency: 'INR', min: 600000, max: 1400000, period: 'YEAR' },
  { location: 'Pune, Maharashtra', country: 'IN', currency: 'INR', min: 500000, max: 1100000, period: 'YEAR' },
  { location: 'London', country: 'GB', currency: 'GBP', min: 40000, max: 65000, period: 'YEAR' },
];

/** Small deterministic generator so every run produces the same fixture. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const monthsEndingAt = (end: string, count: number): string[] => {
  const [y, m] = end.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - count + i, 1)).toISOString().slice(0, 7));
};

export interface FixtureOptions {
  /** Last month with postings, YYYY-MM. */
  endMonth: string;
  months?: number;
  seed?: number;
  retrievedAt?: string;
}

export function buildSyntheticMarketFixture(options: FixtureOptions): ImportRequest {
  const { endMonth, months = 12, seed = 20261012 } = options;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const [endYear, endMonthNumber] = endMonth.split('-').map(Number);
  if (Date.UTC(endYear, endMonthNumber, 1) > Date.parse(retrievedAt)) {
    throw new Error(`endMonth ${endMonth} has not finished by ${retrievedAt}; postings cannot be dated after retrieval`);
  }
  const random = mulberry32(seed);
  const monthList = monthsEndingAt(endMonth, months);
  const postings: Record<string, unknown>[] = [];
  let serial = 0;

  monthList.forEach((month, monthIndex) => {
    // Volume grows by one posting per role every two months
    const perRole = 2 + Math.floor(monthIndex / 2);
    ROLES.forEach((role, roleIndex) => {
      for (let i = 0; i < perRole; i++) {
        serial += 1;
        const city = CITIES[Math.floor(random() * CITIES.length)];
        const day = String(1 + Math.floor(random() * 27)).padStart(2, '0');
        const late = monthIndex >= months - 3 && roleIndex === 3;
        postings.push({
          sourceRecordId: `fixture-${serial}`,
          title: role.title,
          company: `Fixture Employer ${1 + (serial % 23)}`,
          location: city.location,
          country: city.country,
          remote: random() < 0.3,
          postedAt: `${month}-${day}T09:00:00.000Z`,
          description: late ? `${role.text} Kubernetes clusters in production.` : role.text,
          salary: random() < 0.6 ? { min: city.min, max: city.max, currency: city.currency, period: city.period } : undefined,
        });
      }
    });
  });

  const first = postings[0];
  // The same job listed again under another id: must be merged, not counted twice
  postings.push({ ...first, sourceRecordId: 'fixture-crosspost-1' });
  // No publication date: kept, but excluded from monthly history
  postings.push({ sourceRecordId: 'fixture-undated-1', title: 'Backend Developer', company: 'Fixture Employer 99', location: 'Pune, Maharashtra', country: 'IN', description: 'Python and Docker.' });
  // Invalid: minimum salary above maximum
  postings.push({ sourceRecordId: 'fixture-invalid-1', title: 'Data Analyst', postedAt: `${endMonth}-05T09:00:00.000Z`, salary: { min: 9, max: 1, currency: 'INR', period: 'YEAR' } });

  return {
    sourceId: SYNTHETIC_FIXTURE_SOURCE.id,
    retrievedAt,
    postings,
  };
}
