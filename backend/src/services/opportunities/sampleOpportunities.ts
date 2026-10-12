import type { CanonicalOpportunity, OpportunitySearchQuery } from './OpportunityProvider.js';

/**
 * Built-in demo listings, shown only when no live job provider key is configured.
 *
 * They exist so search, filtering, scoring and application tracking can be tried without an
 * external account. Every one is flagged `isSample`, names a "Sample Company", and links to a
 * web search instead of a real application page, so it can never be mistaken for a live posting.
 */

export const SAMPLE_PROVIDER_NAME = 'Sample listings (no live provider configured)';

interface SampleListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME';
  /** Null on purpose for some listings: real postings often omit salary. */
  salary: { min: number; max: number } | null;
  postedDaysAgo: number;
  skills: string[];
  description: string;
}

const LISTINGS: SampleListing[] = [
  { id: 'sample_fullstack_01', title: 'Full Stack Developer', company: 'Sample Company A', location: 'Bengaluru, India', remote: true, employmentType: 'FULL_TIME', salary: { min: 900000, max: 1500000 }, postedDaysAgo: 1, skills: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'MongoDB'], description: 'Build and maintain web features end to end. Requires TypeScript, React, Node.js, REST APIs and MongoDB. Docker is a plus.' },
  { id: 'sample_frontend_01', title: 'Frontend Engineer', company: 'Sample Company B', location: 'Hyderabad, India', remote: false, employmentType: 'FULL_TIME', salary: null, postedDaysAgo: 2, skills: ['React', 'JavaScript', 'HTML', 'CSS'], description: 'Build accessible user interfaces with React, JavaScript, HTML and CSS. Experience with testing is preferred.' },
  { id: 'sample_backend_01', title: 'Backend Engineer', company: 'Sample Company C', location: 'Pune, India', remote: true, employmentType: 'FULL_TIME', salary: { min: 1000000, max: 1800000 }, postedDaysAgo: 5, skills: ['Node.js', 'PostgreSQL', 'Docker', 'REST APIs'], description: 'Design and operate APIs with Node.js and PostgreSQL. Requires Docker and REST APIs. Kubernetes is preferred.' },
  { id: 'sample_intern_01', title: 'Software Engineering Intern', company: 'Sample Company D', location: 'Chennai, India', remote: false, employmentType: 'INTERN', salary: null, postedDaysAgo: 3, skills: ['Python', 'Git', 'SQL'], description: 'Six-month internship for final-year students. Requires Python, Git and SQL fundamentals.' },
  { id: 'sample_data_01', title: 'Data Analyst', company: 'Sample Company E', location: 'Mumbai, India', remote: false, employmentType: 'FULL_TIME', salary: { min: 600000, max: 1000000 }, postedDaysAgo: 9, skills: ['SQL', 'Excel', 'Python', 'Tableau'], description: 'Analyse product and sales data. Requires SQL, Excel and Python. Tableau is preferred.' },
  { id: 'sample_devops_01', title: 'DevOps Engineer', company: 'Sample Company F', location: 'Remote', remote: true, employmentType: 'CONTRACT', salary: { min: 1200000, max: 2000000 }, postedDaysAgo: 12, skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'], description: 'Twelve-month contract. Requires Docker, Kubernetes, AWS, CI/CD and Linux.' },
  { id: 'sample_ml_01', title: 'Machine Learning Engineer', company: 'Sample Company G', location: 'Bengaluru, India', remote: true, employmentType: 'FULL_TIME', salary: { min: 1500000, max: 2600000 }, postedDaysAgo: 20, skills: ['Python', 'Machine Learning', 'PyTorch', 'SQL'], description: 'Train and deploy models. Requires Python, Machine Learning, PyTorch and SQL.' },
  { id: 'sample_mobile_01', title: 'Mobile App Developer', company: 'Sample Company H', location: 'Delhi, India', remote: false, employmentType: 'CONTRACT', salary: null, postedDaysAgo: 0, skills: ['React Native', 'JavaScript', 'REST APIs'], description: 'Build cross-platform mobile apps with React Native and JavaScript against REST APIs.' },
  { id: 'sample_support_01', title: 'Technical Support Associate', company: 'Sample Company I', location: 'Kochi, India', remote: true, employmentType: 'PART_TIME', salary: null, postedDaysAgo: 40, skills: [], description: 'Help customers with questions about our product by chat and email. Full training is provided.' },
  // Same role re-posted through a second board: exercises duplicate removal
  { id: 'sample_fullstack_01_repost', title: 'Full Stack Developer', company: 'Sample Company A', location: 'Bengaluru, India', remote: true, employmentType: 'FULL_TIME', salary: { min: 900000, max: 1500000 }, postedDaysAgo: 1, skills: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'MongoDB'], description: 'Build and maintain web features end to end. Requires TypeScript, React, Node.js, REST APIs and MongoDB. Docker is a plus.' },
];

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'jobs', 'job', 'role', 'roles', 'senior', 'junior', 'lead', 'in', 'at', 'of', 'a', 'an']);

const tokens = (text: string): string[] =>
  text.toLowerCase().split(/[^a-z0-9+#.]+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));

/** Demo listings that match the keywords and location of a search. */
export function searchSampleOpportunities(query: OpportunitySearchQuery): CanonicalOpportunity[] {
  const now = Date.now();
  const wanted = tokens(query.keywords || '');
  const place = (query.location || '').trim().toLowerCase();

  return LISTINGS.filter(listing => {
    if (wanted.length > 0) {
      const haystack = new Set(tokens(`${listing.title} ${listing.skills.join(' ')} ${listing.description}`));
      if (!wanted.some(t => haystack.has(t))) return false;
    }
    if (place && place !== 'remote') {
      return listing.location.toLowerCase().includes(place);
    }
    if (place === 'remote') return listing.remote;
    return true;
  }).map(listing => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${listing.title} jobs`)}`;
    return {
      externalId: listing.id,
      provider: SAMPLE_PROVIDER_NAME,
      title: listing.title,
      company: `${listing.company} (demo listing)`,
      description: listing.description,
      location: listing.location,
      remote: listing.remote,
      employmentType: listing.employmentType,
      salary: listing.salary ? { ...listing.salary, currency: 'INR', period: 'YEARLY' } : null,
      postedAt: new Date(now - listing.postedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      applicationUrl: searchUrl,
      sourceUrl: searchUrl,
      skills: listing.skills,
      isSample: true,
      fetchedAt: new Date(now).toISOString(),
    };
  });
}
