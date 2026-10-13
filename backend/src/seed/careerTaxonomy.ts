import { RequirementImportance } from '../models/CareerRequirement.js';
import { CAREER_DOMAIN_CATALOGUE } from './careerDomainCatalogue.js';

export interface TaxonomyRequirement {
  skill: string;
  importance: RequirementImportance;
  weight: number; // 1-5
}

export interface TaxonomyCareer {
  title: string;
  category: string;
  domain: string;
  description: string;
  requirements: TaxonomyRequirement[];
  // Titles of adjacent careers with a hand-assigned similarity (0-100)
  similar: Array<{ title: string; score: number }>;
  /** Where the requirements come from, when it is more than SkillBridge's own editorial choice (E1). */
  source?: { kind: 'onet'; code: string; title: string };
}

const req = (
  skill: string,
  importance: RequirementImportance = 'required',
  weight = 4
): TaxonomyRequirement => ({ skill, importance, weight });

/**
 * Curated career taxonomy used for deterministic matching.
 * Requirements are an editorial baseline of commonly expected skills per role;
 * they are not derived from live labour-market statistics.
 */
export const CAREER_TAXONOMY: TaxonomyCareer[] = [
  {
    title: 'Software Engineer',
    category: 'Engineering',
    domain: 'Software Engineering',
    description: 'Designs, builds and maintains software systems across the stack.',
    requirements: [
      req('Data Structures and Algorithms', 'required', 5),
      req('Git', 'required', 4),
      req('JavaScript', 'preferred', 4),
      req('Python', 'preferred', 4),
      req('SQL', 'required', 3),
      req('REST APIs', 'preferred', 3),
      req('Testing', 'supporting', 3),
      req('Problem Solving', 'supporting', 3)
    ],
    similar: [
      { title: 'Backend Engineer', score: 80 },
      { title: 'Full Stack Developer', score: 80 },
      { title: 'Frontend Engineer', score: 70 }
    ]
  },
  {
    title: 'Frontend Engineer',
    category: 'Engineering',
    domain: 'Software Engineering',
    description: 'Builds accessible, performant user interfaces for the web.',
    requirements: [
      req('JavaScript', 'required', 5),
      req('HTML', 'required', 4),
      req('CSS', 'required', 4),
      req('React', 'required', 5),
      req('TypeScript', 'preferred', 4),
      req('Git', 'preferred', 3),
      req('REST APIs', 'supporting', 3),
      req('Testing', 'supporting', 2)
    ],
    similar: [
      { title: 'Full Stack Developer', score: 80 },
      { title: 'Software Engineer', score: 70 },
      { title: 'UI/UX Designer', score: 50 }
    ]
  },
  {
    title: 'Backend Engineer',
    category: 'Engineering',
    domain: 'Software Engineering',
    description: 'Builds server-side services, data stores and APIs.',
    requirements: [
      req('Node.js', 'preferred', 4),
      req('Python', 'preferred', 4),
      req('Java', 'supporting', 3),
      req('SQL', 'required', 5),
      req('REST APIs', 'required', 5),
      req('Git', 'required', 3),
      req('Docker', 'preferred', 3),
      req('MongoDB', 'supporting', 3)
    ],
    similar: [
      { title: 'Software Engineer', score: 80 },
      { title: 'Full Stack Developer', score: 75 },
      { title: 'DevOps Engineer', score: 55 }
    ]
  },
  {
    title: 'Full Stack Developer',
    category: 'Engineering',
    domain: 'Software Engineering',
    description: 'Delivers features end to end across client, server and database.',
    requirements: [
      req('JavaScript', 'required', 5),
      req('React', 'required', 4),
      req('Node.js', 'required', 4),
      req('SQL', 'preferred', 3),
      req('MongoDB', 'preferred', 3),
      req('REST APIs', 'required', 4),
      req('HTML', 'preferred', 3),
      req('CSS', 'preferred', 3),
      req('Git', 'required', 3),
      req('TypeScript', 'supporting', 3)
    ],
    similar: [
      { title: 'Frontend Engineer', score: 80 },
      { title: 'Backend Engineer', score: 75 },
      { title: 'Software Engineer', score: 80 }
    ]
  },
  {
    title: 'Data Analyst',
    category: 'Data',
    domain: 'Data & Analytics',
    description: 'Turns raw data into reports, dashboards and decisions.',
    requirements: [
      req('SQL', 'required', 5),
      req('Excel', 'required', 4),
      req('Python', 'preferred', 4),
      req('Data Visualization', 'required', 4),
      req('Statistics', 'required', 4),
      req('Tableau', 'preferred', 3),
      req('Power BI', 'preferred', 3),
      req('Communication', 'supporting', 3)
    ],
    similar: [
      { title: 'Data Scientist', score: 70 },
      { title: 'Business Analyst', score: 65 }
    ]
  },
  {
    title: 'Data Scientist',
    category: 'Data',
    domain: 'Data & Analytics',
    description: 'Builds statistical and machine-learning models to answer business questions.',
    requirements: [
      req('Python', 'required', 5),
      req('SQL', 'required', 4),
      req('Machine Learning', 'required', 5),
      req('Statistics', 'required', 5),
      req('Pandas', 'preferred', 4),
      req('NumPy', 'preferred', 3),
      req('scikit-learn', 'preferred', 4),
      req('Data Visualization', 'supporting', 3)
    ],
    similar: [
      { title: 'Machine Learning Engineer', score: 80 },
      { title: 'Data Analyst', score: 70 }
    ]
  },
  {
    title: 'Machine Learning Engineer',
    category: 'AI / ML',
    domain: 'Artificial Intelligence',
    description: 'Trains, evaluates and ships machine-learning models to production.',
    requirements: [
      req('Python', 'required', 5),
      req('Machine Learning', 'required', 5),
      req('Deep Learning', 'required', 4),
      req('PyTorch', 'preferred', 4),
      req('TensorFlow', 'preferred', 4),
      req('SQL', 'supporting', 3),
      req('Docker', 'preferred', 3),
      req('Git', 'required', 3)
    ],
    similar: [
      { title: 'Data Scientist', score: 80 },
      { title: 'Backend Engineer', score: 50 }
    ]
  },
  {
    title: 'DevOps Engineer',
    category: 'Infrastructure',
    domain: 'Cloud & DevOps',
    description: 'Automates build, release and infrastructure operations.',
    requirements: [
      req('Linux', 'required', 5),
      req('Docker', 'required', 5),
      req('Kubernetes', 'preferred', 4),
      req('CI/CD', 'required', 5),
      req('AWS', 'preferred', 4),
      req('Terraform', 'preferred', 3),
      req('Git', 'required', 3),
      req('Python', 'supporting', 3)
    ],
    similar: [
      { title: 'Cloud Engineer', score: 85 },
      { title: 'Backend Engineer', score: 55 }
    ]
  },
  {
    title: 'Cloud Engineer',
    category: 'Infrastructure',
    domain: 'Cloud & DevOps',
    description: 'Designs and operates workloads on public cloud platforms.',
    requirements: [
      req('AWS', 'required', 5),
      req('Linux', 'required', 4),
      req('Docker', 'preferred', 4),
      req('Kubernetes', 'preferred', 4),
      req('Terraform', 'preferred', 4),
      req('Networking', 'required', 4),
      req('Azure', 'supporting', 3),
      req('Python', 'supporting', 3)
    ],
    similar: [
      { title: 'DevOps Engineer', score: 85 },
      { title: 'Cybersecurity Analyst', score: 45 }
    ]
  },
  {
    title: 'Mobile App Developer',
    category: 'Engineering',
    domain: 'Software Engineering',
    description: 'Builds native and cross-platform mobile applications.',
    requirements: [
      req('React Native', 'preferred', 4),
      req('Flutter', 'preferred', 4),
      req('Kotlin', 'preferred', 4),
      req('Swift', 'preferred', 4),
      req('JavaScript', 'supporting', 3),
      req('REST APIs', 'required', 4),
      req('Git', 'required', 3)
    ],
    similar: [
      { title: 'Frontend Engineer', score: 65 },
      { title: 'Full Stack Developer', score: 60 }
    ]
  },
  {
    title: 'Cybersecurity Analyst',
    category: 'Security',
    domain: 'Cybersecurity',
    description: 'Monitors, assesses and hardens systems against security threats.',
    requirements: [
      req('Networking', 'required', 5),
      req('Linux', 'required', 4),
      req('Network Security', 'required', 5),
      req('Python', 'preferred', 3),
      req('Penetration Testing', 'preferred', 4),
      req('SIEM', 'preferred', 3),
      req('Cryptography', 'supporting', 3)
    ],
    similar: [
      { title: 'Cloud Engineer', score: 45 },
      { title: 'DevOps Engineer', score: 40 }
    ]
  },
  {
    title: 'UI/UX Designer',
    category: 'Design',
    domain: 'Design',
    description: 'Researches, designs and prototypes user experiences.',
    requirements: [
      req('Figma', 'required', 5),
      req('User Research', 'required', 4),
      req('Wireframing', 'required', 4),
      req('Prototyping', 'required', 4),
      req('HTML', 'supporting', 2),
      req('CSS', 'supporting', 2),
      req('Communication', 'preferred', 3)
    ],
    similar: [
      { title: 'Frontend Engineer', score: 50 },
      { title: 'Product Manager', score: 45 }
    ]
  },
  {
    title: 'Business Analyst',
    category: 'Business',
    domain: 'Business & Management',
    description: 'Translates business needs into requirements and measurable outcomes.',
    requirements: [
      req('Excel', 'required', 4),
      req('SQL', 'preferred', 4),
      req('Requirements Analysis', 'required', 5),
      req('Data Visualization', 'preferred', 3),
      req('Communication', 'required', 4),
      req('Agile', 'preferred', 3),
      req('Power BI', 'supporting', 3)
    ],
    similar: [
      { title: 'Data Analyst', score: 65 },
      { title: 'Product Manager', score: 60 }
    ]
  },
  {
    title: 'Product Manager',
    category: 'Product',
    domain: 'Business & Management',
    description: 'Owns product direction, prioritisation and delivery outcomes.',
    requirements: [
      req('Product Strategy', 'required', 5),
      req('Agile', 'required', 4),
      req('User Research', 'preferred', 4),
      req('Communication', 'required', 4),
      req('Leadership', 'preferred', 4),
      req('SQL', 'supporting', 2),
      req('Data Visualization', 'supporting', 2)
    ],
    similar: [
      { title: 'Business Analyst', score: 60 },
      { title: 'UI/UX Designer', score: 45 }
    ]
  },

  // E1: six careers whose requirements are informed by the O*NET 31.0 Database (CC BY 4.0). The
  // catalogue keeps each requirement's basis and the attribution; see docs/E1_CAREER_DOMAINS.md.
  // The fourteen careers above are unchanged, so their scores do not move.
  ...CAREER_DOMAIN_CATALOGUE.map(c => ({
    title: c.title,
    category: c.category,
    domain: c.domain,
    description: c.description,
    requirements: c.requirements.map(r => req(r.skill, r.importance, r.weight)),
    similar: c.similar,
    source: { kind: 'onet' as const, code: c.onet.code, title: c.onet.title }
  }))
];
