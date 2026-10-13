import type { RequirementImportance } from '../models/CareerRequirement.js';

/**
 * Additional career domains and roles (E1); see docs/E1_CAREER_DOMAINS.md. These careers are part of
 * the shared taxonomy (seed/careerTaxonomy.ts appends them), so matching, readiness,
 * recommendations and roadmaps use them like any other career. This file is their provenance
 * record: the O*NET occupation behind each role and the basis of every requirement.
 *
 * Sources: each requirement names its basis. Most come from the O*NET 31.0 Database:
 *  - 'onet_software': the occupation's software examples, with O*NET's own "Hot Technology" and
 *    "In Demand" flags;
 *  - 'onet_knowledge': a knowledge area and its O*NET importance rating (1-5).
 * Requirements O*NET does not name for the occupation are marked 'editorial' and explained.
 * Which requirements are included, their importance and weights are SkillBridge editorial choices
 * informed by those data; they are not O*NET ratings.
 */

export const ONET_ATTRIBUTION =
  'This page includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. SkillBridge has modified the information: it selected examples, mapped them to its own skill names and assigned importance and weights. USDOL/ETA has not approved, endorsed, or tested these modifications.';
export const ONET_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const ONET_DATABASE_URL = 'https://www.onetcenter.org/database.html';
export const ONET_ACCESSED_ON = '2026-10-12';

export type RequirementBasis =
  | { type: 'onet_software'; examples: string[]; hotTechnology: boolean; inDemand: boolean }
  | { type: 'onet_knowledge'; element: string; importance: number }
  | { type: 'editorial'; note: string };

export interface CatalogueRequirement {
  /** SkillBridge skill name: an existing lexicon name, or one proposed below. */
  skill: string;
  importance: RequirementImportance;
  weight: number;
  basis: RequirementBasis;
}

export interface CatalogueCareer {
  title: string;
  category: string;
  domain: string;
  /** True when the domain is not among the existing taxonomy's domains. */
  newDomain: boolean;
  description: string;
  onet: { code: string; title: string; note?: string };
  requirements: CatalogueRequirement[];
  similar: Array<{ title: string; score: number }>;
}

const sw = (examples: string[], hotTechnology: boolean, inDemand: boolean): RequirementBasis => ({ type: 'onet_software', examples, hotTechnology, inDemand });
const kn = (element: string, importance: number): RequirementBasis => ({ type: 'onet_knowledge', element, importance });
const ed = (note: string): RequirementBasis => ({ type: 'editorial', note });
const r = (skill: string, importance: RequirementImportance, weight: number, basis: RequirementBasis): CatalogueRequirement => ({ skill, importance, weight, basis });

export const CAREER_DOMAIN_CATALOGUE: CatalogueCareer[] = [
  {
    title: 'QA Automation Engineer',
    category: 'Engineering',
    domain: 'Software Engineering',
    newDomain: false,
    description: 'Designs and automates software tests, from UI and API checks to performance tests, and reports defects.',
    onet: { code: '15-1253.00', title: 'Software Quality Assurance Analysts and Testers' },
    requirements: [
      r('Testing', 'required', 5, ed('The defining activity of the occupation (O*NET title: Software Quality Assurance Analysts and Testers).')),
      r('Selenium', 'required', 4, sw(['Selenium'], true, true)),
      r('Python', 'preferred', 4, sw(['Python'], true, true)),
      r('Java', 'preferred', 4, sw(['Oracle Java'], true, true)),
      r('SQL', 'preferred', 3, sw(['Structured query language SQL'], true, true)),
      r('Git', 'preferred', 3, sw(['Git'], true, true)),
      r('REST APIs', 'preferred', 3, sw(['RESTful API'], false, true)),
      r('Playwright', 'preferred', 3, sw(['Microsoft Playwright'], false, true)),
      r('Postman', 'supporting', 3, sw(['Postman'], false, true)),
      r('Jenkins', 'supporting', 3, sw(['Jenkins CI'], true, true)),
      r('Jira', 'supporting', 2, sw(['Atlassian JIRA'], true, true)),
      r('Appium', 'supporting', 2, sw(['Appium'], false, true)),
      r('JMeter', 'supporting', 2, sw(['Apache JMeter'], false, true)),
    ],
    similar: [
      { title: 'Software Engineer', score: 60 },
      { title: 'Backend Engineer', score: 50 },
      { title: 'DevOps Engineer', score: 40 },
    ],
  },
  {
    title: 'Data Engineer',
    category: 'Data',
    domain: 'Data & Analytics',
    newDomain: false,
    description: 'Builds and runs the pipelines and warehouses that move, clean and store data for analysis.',
    onet: { code: '15-1243.01', title: 'Data Warehousing Specialists', note: 'O*NET has no separate "Data Engineer" occupation; Data Warehousing Specialists is the closest.' },
    requirements: [
      r('SQL', 'required', 5, sw(['Structured query language SQL'], true, true)),
      r('Python', 'required', 5, sw(['Python'], true, true)),
      r('Data Warehousing', 'required', 4, sw(['Oracle Warehouse Builder'], false, false)),
      r('ETL', 'required', 4, sw(['Informatica PowerCenter', 'Talend Open Studio', 'Adeptia ETL Suite'], false, false)),
      r('Apache Spark', 'preferred', 4, sw(['Apache Spark'], true, false)),
      r('Kafka', 'preferred', 3, sw(['Apache Kafka'], true, false)),
      r('AWS', 'preferred', 3, sw(['Amazon Web Services AWS software'], true, false)),
      r('Hadoop', 'supporting', 3, sw(['Apache Hadoop'], true, false)),
      r('Linux', 'supporting', 2, sw(['Linux'], true, false)),
      r('Power BI', 'supporting', 2, sw(['Microsoft Power BI'], true, true)),
      r('Tableau', 'supporting', 2, sw(['Tableau'], true, true)),
    ],
    similar: [
      { title: 'Data Analyst', score: 60 },
      { title: 'Data Scientist', score: 50 },
      { title: 'Backend Engineer', score: 50 },
      { title: 'Cloud Engineer', score: 40 },
    ],
  },
  {
    title: 'Embedded Systems Engineer',
    category: 'Engineering',
    domain: 'Electronics & Embedded Systems',
    newDomain: true,
    description: 'Designs and programs the hardware and low-level software of devices, from microcontrollers to digital logic.',
    onet: { code: '17-2061.00', title: 'Computer Hardware Engineers' },
    requirements: [
      r('C', 'required', 5, sw(['C'], true, true)),
      r('C++', 'preferred', 4, sw(['C++'], true, true)),
      r('Microcontrollers', 'required', 4, ed('Not an O*NET software example; reflects the knowledge areas Computers and Electronics (importance 4.71) and Engineering and Technology (4.66) for this occupation.')),
      r('Verilog', 'preferred', 3, sw(['Verilog'], false, true)),
      r('VHDL', 'supporting', 3, sw(['Very high speed integrated circuit VHSIC hardware description language VHDL simulation software'], false, true)),
      r('Linux', 'preferred', 3, sw(['Linux'], true, true)),
      r('RTOS', 'supporting', 3, ed('Not an O*NET software example; real-time operating systems are a common embedded-software expectation.')),
      r('Python', 'supporting', 3, sw(['Python'], true, true)),
      r('MATLAB', 'supporting', 2, sw(['The MathWorks MATLAB'], true, true)),
      r('Git', 'supporting', 2, sw(['Git'], true, false)),
    ],
    similar: [
      { title: 'Software Engineer', score: 40 },
      { title: 'Mobile App Developer', score: 20 },
    ],
  },
  {
    title: 'Digital Marketing Analyst',
    category: 'Marketing',
    domain: 'Marketing',
    newDomain: true,
    description: 'Plans, measures and improves search, advertising and web campaigns using analytics data.',
    onet: { code: '13-1161.01', title: 'Search Marketing Strategists' },
    requirements: [
      r('Google Analytics', 'required', 5, sw(['Google Analytics'], true, true)),
      r('SEO', 'required', 4, sw(['Moz search engine optimization SEO software'], false, true)),
      r('Google Ads', 'preferred', 4, sw(['Google Ads'], false, true)),
      r('Excel', 'required', 3, sw(['Microsoft Excel'], true, true)),
      r('Google Tag Manager', 'preferred', 3, sw(['Google Tag Manager'], false, true)),
      r('Communication', 'required', 3, kn('English Language', 4.27)),
      r('Data Analysis', 'preferred', 3, kn('Mathematics', 3.52)),
      r('HTML', 'supporting', 2, sw(['Hypertext markup language HTML'], true, true)),
      r('WordPress', 'supporting', 2, sw(['WordPress'], true, true)),
      r('CSS', 'supporting', 1, sw(['Cascading style sheets CSS'], true, true)),
    ],
    similar: [
      { title: 'Business Analyst', score: 40 },
      { title: 'Data Analyst', score: 40 },
      { title: 'Product Manager', score: 30 },
    ],
  },
  {
    title: 'Financial Analyst',
    category: 'Business',
    domain: 'Finance',
    newDomain: true,
    description: 'Analyses financial data and builds models to support investment, budgeting and business decisions.',
    onet: { code: '13-2051.00', title: 'Financial and Investment Analysts', note: 'O*NET 31.0 has no knowledge ratings for this occupation, so only software examples are cited.' },
    requirements: [
      r('Excel', 'required', 5, sw(['Microsoft Excel'], true, true)),
      r('Financial Modeling', 'required', 5, ed('Not an O*NET software example; the core analytical task of the occupation as described by O*NET ("conduct quantitative analyses of information involving investment programs or financial data").')),
      r('SQL', 'preferred', 3, sw(['Structured query language SQL'], true, true)),
      r('Power BI', 'preferred', 3, sw(['Microsoft Power BI'], true, true)),
      r('VBA', 'preferred', 3, sw(['Microsoft Visual Basic for Applications VBA'], true, false)),
      r('Statistics', 'preferred', 3, ed('Quantitative analysis is central to the O*NET occupation description.')),
      r('Tableau', 'supporting', 2, sw(['Tableau'], true, true)),
      r('SAP', 'supporting', 2, sw(['SAP software'], true, true)),
      r('R', 'supporting', 2, sw(['R'], true, false)),
      r('SAS', 'supporting', 2, sw(['SAS'], true, false)),
    ],
    similar: [
      { title: 'Business Analyst', score: 60 },
      { title: 'Data Analyst', score: 50 },
    ],
  },
  {
    title: 'Health Informatics Specialist',
    category: 'Data',
    domain: 'Healthcare Informatics',
    newDomain: true,
    description: 'Supports clinical information systems and analyses health data to improve care and operations.',
    onet: { code: '15-1211.01', title: 'Health Informatics Specialists' },
    requirements: [
      r('EHR Systems', 'required', 4, sw(['Epic Systems', 'eClinicalWorks EHR software', 'MEDITECH software'], true, false)),
      r('SQL', 'required', 4, sw(['Structured query language SQL'], true, true)),
      r('Healthcare Data Standards', 'preferred', 3, ed('Not an O*NET software example; HL7 and FHIR interoperability standards reflect the knowledge area Medicine and Dentistry (importance 3.70) together with Computers and Electronics (4.20).')),
      r('Excel', 'preferred', 3, sw(['Microsoft Excel'], true, true)),
      r('Python', 'preferred', 3, sw(['Python'], true, true)),
      r('Tableau', 'preferred', 3, sw(['Tableau'], true, true)),
      r('Communication', 'preferred', 3, kn('English Language', 4.05)),
      r('Data Analysis', 'preferred', 3, ed('Analysis of clinical data is part of the O*NET occupation description.')),
      r('Power BI', 'supporting', 2, sw(['Microsoft Power BI'], true, true)),
      r('R', 'supporting', 2, sw(['R'], true, true)),
      r('SAS', 'supporting', 2, sw(['SAS'], true, true)),
    ],
    similar: [
      { title: 'Data Analyst', score: 50 },
      { title: 'Business Analyst', score: 40 },
    ],
  },
];

/**
 * The skills added to the shared lexicon for these careers (lexicon version 2). Their definitions,
 * aliases and casing live in backend/src/seed/skillLexicon.ts and its AI mirror; this list only
 * records which ones came with E1.
 */
export const E1_LEXICON_SKILLS: string[] = [
  'Playwright', 'Appium', 'JMeter', 'ETL', 'Data Warehousing', 'Microcontrollers', 'RTOS', 'Verilog', 'VHDL',
  'Google Analytics', 'SEO', 'Google Ads', 'Google Tag Manager', 'WordPress', 'Financial Modeling', 'VBA', 'SAP', 'SAS',
  'EHR Systems', 'Healthcare Data Standards',
];
