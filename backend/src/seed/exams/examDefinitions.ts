/**
 * Exam preparation pilots (E2, E3); see docs/EXAM_PREP.md.
 *
 * Facts about each exam (its name, conducting body, pattern, marking and syllabus wording) are
 * copied from the official documents listed in `sources`, with the date each was published and the
 * date SkillBridge read it. Everything else is SkillBridge's own and labelled so: topic
 * prerequisites and hour estimates are study-planning estimates, not official figures, and the
 * practice questions are original, not official or past-paper questions.
 *
 * SkillBridge is not affiliated with, endorsed by or partnered with IIT Guwahati, the GATE
 * organising committee or the Staff Selection Commission.
 */

export interface ExamSource {
  title: string;
  url: string;
  /** What the official document says about when it was published, and how we know. */
  published: string;
  accessedOn: string;
}

export interface ExamTopic {
  id: string;
  name: string;
  /** The topic as worded in the official syllabus. */
  officialText: string;
  /** SkillBridge estimate of hours for a first study pass (not an official figure). */
  estimatedHours: number;
  /** SkillBridge's suggested study order: topics worth covering first. */
  prerequisites: string[];
}

export interface ExamSection {
  id: string;
  name: string;
  topics: ExamTopic[];
}

export interface MarkingRule {
  /** Marks for a correct answer of this weight. */
  correct: number;
  /** Marks deducted for a wrong answer (0 = none). */
  wrongPenalty: number;
}

export interface ExamDefinition {
  id: 'gate-cs-2026' | 'ssc-cgl-2026-tier1';
  name: string;
  shortName: string;
  conductingBody: string;
  syllabusVersion: string;
  kind: 'competitive' | 'government_aptitude';
  sources: ExamSource[];
  /** The official pattern, as stated in the sources. */
  officialPattern: string[];
  /** How SkillBridge practice sets apply the pattern (scaled timing, marking). */
  practiceRules: string[];
  /** Seconds per question used for timed practice, derived from the official pattern. */
  secondsPerQuestion: number;
  /** Timed practice runs section by section with a timer each (SSC) or as one paper (GATE). */
  sectionalTiming: boolean;
  sections: ExamSection[];
  disclaimer: string;
}

const ACCESSED = '2026-10-12';

const topic = (id: string, name: string, officialText: string, estimatedHours: number, prerequisites: string[] = []): ExamTopic => ({
  id,
  name,
  officialText,
  estimatedHours,
  prerequisites,
});

export const GATE_CS_2026: ExamDefinition = {
  id: 'gate-cs-2026',
  name: 'GATE 2026: Computer Science and Information Technology (CS)',
  shortName: 'GATE CS 2026',
  conductingBody: 'Organising Institute for GATE 2026: IIT Guwahati',
  syllabusVersion: 'GATE 2026 CS syllabus and GA syllabus (PDFs created 2025-08-07/08)',
  kind: 'competitive',
  sources: [
    {
      title: 'GATE 2026 CS syllabus (official PDF)',
      url: 'https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/CS_2026_Syllabus.pdf',
      published: 'PDF created 2025-08-08 (document metadata); linked from the official "GATE 2026 Test Papers & Syllabus" page',
      accessedOn: ACCESSED,
    },
    {
      title: 'GATE 2026 General Aptitude syllabus (official PDF)',
      url: 'https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/GA_2026_Syllabus.pdf',
      published: 'PDF created 2025-08-07 (document metadata)',
      accessedOn: ACCESSED,
    },
    {
      title: 'GATE 2026 question paper pattern (official page)',
      url: 'https://gate2026.iitg.ac.in/question-paper-pattern.html',
      published: 'Web page; no publication date shown',
      accessedOn: ACCESSED,
    },
  ],
  officialPattern: [
    'Computer Based Test in English; 3 hours; 100 marks.',
    'CS paper: General Aptitude 15 marks, Engineering Mathematics 13 marks, subject questions 72 marks.',
    'Question types: multiple choice (MCQ), multiple select (MSQ) and numerical answer (NAT), of 1 or 2 marks.',
    'A wrong 1-mark MCQ loses 1/3 mark and a wrong 2-mark MCQ loses 2/3 mark; there is no negative marking for MSQ or NAT, and no partial marking in MSQ.',
  ],
  practiceRules: [
    'Each practice question carries 1 or 2 marks and is marked exactly as the official pattern marks its type.',
    'Timed practice allows about 166 seconds per question (180 minutes for a 65-question paper), scaled to the number of questions chosen.',
    'Practice scores are for preparation only. They are not GATE scores and say nothing about qualifying, cut-offs, ranks or admission.',
  ],
  secondsPerQuestion: 166,
  sectionalTiming: false,
  sections: [
    {
      id: 'ga',
      name: 'General Aptitude',
      topics: [
        topic('ga-verbal', 'Verbal aptitude', 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech. Basic vocabulary: words, idioms, and phrases in context. Reading and comprehension, Narrative sequencing.', 8),
        topic('ga-quant', 'Quantitative aptitude', 'Data interpretation: data graphs, 2- and 3-dimensional plots, maps, and tables. Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series. Mensuration and geometry. Elementary statistics and probability.', 10),
        topic('ga-analytical', 'Analytical aptitude', 'Logic: deduction and induction, Analogy, Numerical relations and reasoning.', 6),
        topic('ga-spatial', 'Spatial aptitude', 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping; paper folding, cutting, and patterns in 2 and 3 dimensions.', 4),
      ],
    },
    {
      id: 'em',
      name: 'Engineering Mathematics',
      topics: [
        topic('em-discrete', 'Discrete mathematics', 'Propositional and first order logic. Sets, relations, functions, partial orders and lattices. Monoids, Groups. Graphs: connectivity, matching, colouring. Combinatorics: counting, recurrence relations, generating functions.', 25),
        topic('em-linear-algebra', 'Linear algebra', 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.', 12),
        topic('em-calculus', 'Calculus', 'Limits, continuity and differentiability, Maxima and minima, Mean value theorem, Integration.', 10),
        topic('em-probability', 'Probability and statistics', 'Random variables, Uniform, normal, exponential, Poisson and binomial distributions. Mean, median, mode and standard deviation. Conditional probability and Bayes theorem.', 12),
      ],
    },
    {
      id: 'dl',
      name: 'Digital Logic',
      topics: [topic('dl-core', 'Digital logic', 'Boolean algebra. Combinational and sequential circuits. Minimization. Number representations and computer arithmetic (fixed and floating point).', 15)],
    },
    {
      id: 'coa',
      name: 'Computer Organization and Architecture',
      topics: [topic('coa-core', 'Computer organization and architecture', 'Machine instructions and addressing modes. ALU, data-path and control unit. Instruction pipelining, pipeline hazards. Memory hierarchy: cache, main memory and secondary storage; I/O interface (interrupt and DMA mode).', 25, ['dl-core'])],
    },
    {
      id: 'pds',
      name: 'Programming and Data Structures',
      topics: [topic('pds-core', 'Programming and data structures', 'Programming in C. Recursion. Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.', 25)],
    },
    {
      id: 'algo',
      name: 'Algorithms',
      topics: [topic('algo-core', 'Algorithms', 'Searching, sorting, hashing. Asymptotic worst case time and space complexity. Algorithm design techniques: greedy, dynamic programming and divide-and-conquer. Graph traversals, minimum spanning trees, shortest paths.', 30, ['pds-core', 'em-discrete'])],
    },
    {
      id: 'toc',
      name: 'Theory of Computation',
      topics: [topic('toc-core', 'Theory of computation', 'Regular expressions and finite automata. Context-free grammars and push-down automata. Regular and context-free languages, pumping lemma. Turing machines and undecidability.', 20, ['em-discrete'])],
    },
    {
      id: 'cd',
      name: 'Compiler Design',
      topics: [topic('cd-core', 'Compiler design', 'Lexical analysis, parsing, syntax-directed translation. Runtime environments. Intermediate code generation. Local optimisation, Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.', 15, ['toc-core'])],
    },
    {
      id: 'os',
      name: 'Operating System',
      topics: [topic('os-core', 'Operating system', 'System calls, processes, threads, inter-process communication, concurrency and synchronization. Deadlock. CPU and I/O scheduling. Memory management and virtual memory. File systems.', 25, ['coa-core'])],
    },
    {
      id: 'db',
      name: 'Databases',
      topics: [topic('db-core', 'Databases', 'ER-model. Relational model: relational algebra, tuple calculus, SQL. Integrity constraints, normal forms. File organization, indexing (e.g., B and B+ trees). Transactions and concurrency control.', 20, ['em-discrete'])],
    },
    {
      id: 'cn',
      name: 'Computer Networks',
      topics: [topic('cn-core', 'Computer networks', 'Concept of layering: OSI and TCP/IP Protocol Stacks; packet, circuit and virtual circuit switching; Data link layer; Routing protocols; Fragmentation and IP addressing, IPv4, CIDR notation, ARP, DHCP, ICMP, NAT; Transport layer: flow control and congestion control, UDP, TCP, sockets; Application layer protocols: DNS, SMTP, HTTP, FTP, Email.', 22, ['os-core'])],
    },
  ],
  disclaimer:
    'SkillBridge is not affiliated with or endorsed by IIT Guwahati or the GATE organising committee. Practice questions are written by SkillBridge to the official syllabus; they are not official or past GATE questions. Check the official website for the current syllabus, dates and rules.',
};

export const SSC_CGL_2026_TIER1: ExamDefinition = {
  id: 'ssc-cgl-2026-tier1',
  name: 'SSC Combined Graduate Level Examination 2026: Tier-I',
  shortName: 'SSC CGL 2026 Tier-I',
  conductingBody: 'Staff Selection Commission, Government of India',
  syllabusVersion: 'Notice of Combined Graduate Level Examination, 2026 (paragraphs 13.8 and 13.10)',
  kind: 'government_aptitude',
  sources: [
    {
      title: 'Notice: Combined Graduate Level Examination, 2026 (official PDF)',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
      published: 'The notice states it was to be uploaded to ssc.gov.in on 21-05-2026 (the file name says 2025; the content is the 2026 examination)',
      accessedOn: ACCESSED,
    },
  ],
  officialPattern: [
    'Tier-I: General Intelligence and Reasoning, General Awareness, Quantitative Aptitude and English Comprehension; 25 questions and 50 marks each.',
    '1 hour, with a sectional timer of 15 minutes for each subject (1 hour 20 minutes, 20 minutes per subject, for candidates eligible for a scribe).',
    'Objective multiple-choice questions, set in English and Hindi except English Comprehension.',
    'Negative marking of 0.50 marks for each wrong answer.',
  ],
  practiceRules: [
    'Each practice question carries 2 marks and loses 0.50 for a wrong answer, as in Tier-I.',
    'Timed practice runs section by section with a sectional timer of 36 seconds per question (15 minutes for 25), scaled to the number of questions chosen; a finished section cannot be reopened.',
    'Practice questions are in English only.',
    'Practice scores are for preparation only. They are not SSC marks and say nothing about cut-offs, qualifying or selection.',
  ],
  secondsPerQuestion: 36,
  sectionalTiming: true,
  sections: [
    {
      id: 'reasoning',
      name: 'General Intelligence and Reasoning',
      topics: [
        topic('gir-analogy', 'Analogy and classification', 'Semantic Analogy, Symbolic/Number Analogy, Figural Analogy, Semantic Classification, Symbolic/Number Classification, Figural Classification', 6),
        topic('gir-series', 'Series', 'Semantic Series, Number Series, Figural Series', 5),
        topic('gir-coding', 'Coding and decoding', 'Coding & de-coding, Small & Capital letters/numbers coding, decoding and classification', 5),
        topic('gir-logic', 'Statements, syllogisms and inferences', 'statement conclusion, syllogistic reasoning, Venn Diagrams, Drawing inferences, Critical thinking', 6),
      ],
    },
    {
      id: 'awareness',
      name: 'General Awareness',
      topics: [
        topic('aw-history-polity', 'History, culture and polity', 'India and its neighboring countries especially pertaining History, Culture, Geography, Economic Scene, General Policy', 15),
        topic('aw-science', 'Everyday science', 'matters of every day observations and experience in their scientific aspect as may be expected of any educated person', 10),
      ],
    },
    {
      id: 'quant',
      name: 'Quantitative Aptitude',
      topics: [
        topic('qa-arithmetic', 'Arithmetic', 'computation of whole numbers, decimals, fractions and relationships between numbers, Percentage, Ratio & Proportion, Square roots, Averages, Interest, Profit and Loss, Discount, Partnership Business, Mixture and Alligation, Time and distance, Time & Work', 15),
        topic('qa-algebra', 'Algebra', 'Basic algebraic identities of School Algebra & Elementary surds, Graphs of Linear Equations', 8, ['qa-arithmetic']),
        topic('qa-geometry', 'Geometry and mensuration', 'Triangle and its various kinds of centres, Congruence and similarity of triangles, Circle and its chords, tangents; Triangle, Quadrilaterals, Regular Polygons, Circle, Right Prism, Cone, Cylinder, Sphere, Hemispheres, Rectangular Parallelepiped, Pyramid', 12, ['qa-arithmetic']),
        topic('qa-trigonometry', 'Trigonometry and data', 'Trigonometric ratio, Degree and Radian Measures, Standard Identities, Complementary angles, Heights and Distances, Histogram, Frequency polygon, Bar diagram & Pie chart', 8, ['qa-geometry']),
      ],
    },
    {
      id: 'english',
      name: 'English Comprehension',
      topics: [
        topic('en-vocabulary', 'Vocabulary', "Candidates' ability to understand correct English (vocabulary)", 6),
        topic('en-grammar', 'Grammar and usage', "Candidates' ability to understand correct English, his basic comprehension and writing ability (grammar)", 8),
      ],
    },
  ],
  disclaimer:
    'SkillBridge is not affiliated with or endorsed by the Staff Selection Commission. Practice questions are written by SkillBridge to the indicative syllabus; they are not official or previous-year questions. General Awareness practice covers stable facts only, not current affairs. Check ssc.gov.in for the current notice, dates and rules.',
};

export const EXAMS: ExamDefinition[] = [GATE_CS_2026, SSC_CGL_2026_TIER1];
export const EXAMS_BY_ID = new Map(EXAMS.map(e => [e.id, e]));

export const topicsOf = (exam: ExamDefinition) => exam.sections.flatMap(s => s.topics.map(t => ({ ...t, sectionId: s.id, sectionName: s.name })));
