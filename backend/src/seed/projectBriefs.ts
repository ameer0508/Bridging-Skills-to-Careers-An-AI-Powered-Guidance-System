import crypto from 'node:crypto';

/**
 * Curated practice-project briefs written for SkillBridge.
 *
 * A brief names the skills it exercises, concrete tasks and what should exist at the end. Which
 * briefs a user is shown, and why, is decided from their own skill gaps (ProjectSuggestionService).
 * Nothing here is generated at run time and no brief is tied to a paid tool or service.
 */

export interface ProjectBrief {
  id: string;
  title: string;
  summary: string;
  /** Skills the project exercises, by their lexicon / career-requirement names. */
  skills: string[];
  tasks: string[];
  deliverables: string[];
  /**
   * Groups of alternatives: a project uses one skill of each group (one mobile framework, one
   * dashboard tool), so only one of them is counted for a user.
   */
  oneOf: string[][];
  /** Planning range in hours. An assumption, like every effort figure (docs/SCORING.md section 13). */
  effortHours: { low: number; high: number };
}

const brief = (id: string, title: string, summary: string, skills: string[], tasks: string[], deliverables: string[], low: number, high: number, oneOf: string[][] = []): ProjectBrief => ({
  id,
  title,
  summary,
  skills,
  tasks,
  deliverables,
  oneOf,
  effortHours: { low, high }
});

export const PROJECT_BRIEFS: ProjectBrief[] = [
  brief(
    'task-tracker-web',
    'Task tracker web app',
    'A single-page app for creating, filtering and completing tasks, typed end to end and covered by tests.',
    ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Testing', 'Git'],
    [
      'Sketch the screens and list the states each one can be in (empty, loading, error, filled).',
      'Build the task list, the add form and the filters as typed React components.',
      'Keep tasks in browser storage so a reload does not lose them.',
      'Write tests for adding, completing and filtering a task.',
      'Make every control usable by keyboard and check the layout on a phone-sized screen.'
    ],
    ['A public repository with a commit history that shows the steps', 'A README explaining how to run the app and its tests', 'A passing test run'],
    15,
    30
  ),
  brief(
    'rest-api-service',
    'Bookings REST API',
    'A small API for a booking system with validation, a relational database and automated tests.',
    ['Node.js', 'REST APIs', 'SQL', 'Testing', 'Git', 'JavaScript', 'TypeScript'],
    [
      'Design the resources and write down each endpoint, its inputs and its error responses.',
      'Create the database tables and the queries behind each endpoint, using bound parameters.',
      'Validate every request body and return clear errors for invalid input.',
      'Write tests that call the API, including the failure cases.',
      'Document the endpoints with example requests and responses.'
    ],
    ['A public repository', 'API documentation with examples', 'A test suite covering success and failure cases'],
    15,
    35
  ),
  brief(
    'python-api-service',
    'Inventory API in Python',
    'A Python web API over a relational database, with tests and a container image.',
    ['Python', 'REST APIs', 'SQL', 'Testing', 'Docker', 'Git'],
    [
      'Model the inventory items and stock movements as tables.',
      'Implement endpoints to list, add and adjust stock, rejecting impossible adjustments.',
      'Write tests for the stock rules.',
      'Add a Dockerfile so the service starts with one command.',
      'Record the design decisions you made and why.'
    ],
    ['A public repository', 'A Dockerfile that builds and runs the service', 'A README with setup steps and design notes'],
    15,
    35
  ),
  brief(
    'document-store-app',
    'Notes service on a document database',
    'A notes backend that stores documents in MongoDB, with indexes chosen from the queries it runs.',
    ['MongoDB', 'Node.js', 'REST APIs', 'JavaScript', 'Git'],
    [
      'Decide the shape of a note document and what must be validated on write.',
      'Implement create, search by tag and full-text search.',
      'Add the indexes those queries need and show the difference they make.',
      'Scope every query to the signed-in user and test that another user cannot read a note.',
      'Write up when a document database fits this problem and when it would not.'
    ],
    ['A public repository', 'A short write-up of the data model and indexes', 'Tests for ownership'],
    12,
    30
  ),
  brief(
    'algorithms-notebook',
    'Algorithms practice log',
    'Implement and test a set of classic data structures and algorithms, with their costs written down.',
    ['Data Structures and Algorithms', 'Problem Solving', 'Python', 'JavaScript', 'Java', 'Testing', 'Git'],
    [
      'Implement a stack, a queue, a hash map and a binary search tree from scratch.',
      'Implement binary search, a breadth-first and a depth-first traversal, and one sorting algorithm.',
      'Write tests for each, including empty and single-element inputs.',
      'State the time and space cost of each operation and how you worked it out.',
      'Solve five problems that combine two of these and explain each solution in a paragraph.'
    ],
    ['A public repository of implementations and tests', 'A cost table for every operation', 'Five written problem explanations'],
    20,
    40,
    [['Python', 'JavaScript', 'Java']]
  ),
  brief(
    'sales-dashboard',
    'Sales analysis and dashboard',
    'Clean a public dataset, answer business questions with queries and present the answers in a dashboard.',
    ['SQL', 'Excel', 'Data Visualization', 'Statistics', 'Tableau', 'Power BI', 'Communication', 'Python'],
    [
      'Pick an openly licensed sales or transactions dataset and record where it came from.',
      'Clean it: document every row you removed or corrected and why.',
      'Write the queries that answer five specific business questions.',
      'Build a dashboard with one chart per question and a note on what each shows.',
      'Write a one-page summary for a non-technical reader, including what the data cannot tell you.'
    ],
    ['The cleaned dataset with a change log', 'A dashboard file or published view', 'A one-page written summary'],
    15,
    30,
    [['Tableau', 'Power BI', 'Excel']]
  ),
  brief(
    'ml-tabular-model',
    'Prediction model on tabular data',
    'Train, evaluate and document a model on a public dataset, with a baseline to compare against.',
    ['Python', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'scikit-learn', 'Data Visualization', 'Git'],
    [
      'Choose an openly licensed dataset and state the question the model answers.',
      'Explore the data and plot the distributions that matter for the question.',
      'Split the data before any fitting, then train a simple baseline and one stronger model.',
      'Report the same metrics for both on held-out data and say which errors matter most.',
      'Write down the limits: what the data does not cover and where the model should not be used.'
    ],
    ['A notebook or scripts that reproduce the results', 'A results table comparing the baseline and the model', 'A written section on limits'],
    20,
    40
  ),
  brief(
    'deep-learning-classifier',
    'Image or text classifier',
    'Train a small neural network, track the experiments and package the model for use.',
    ['Deep Learning', 'PyTorch', 'TensorFlow', 'Python', 'Machine Learning', 'Docker', 'Git'],
    [
      'Pick a small public dataset that trains on an ordinary laptop or a free notebook.',
      'Train a simple network and record the settings and results of every run.',
      'Plot training and validation curves and explain any overfitting you see.',
      'Evaluate on a held-out set and show examples the model gets wrong.',
      'Package inference behind a small script or container that takes one input and returns a label.'
    ],
    ['Training code with a log of runs', 'Curves and an error analysis', 'A runnable inference script or image'],
    20,
    45,
    [['PyTorch', 'TensorFlow']]
  ),
  brief(
    'containerised-pipeline',
    'Containerised service with a delivery pipeline',
    'Put a small service in a container and build a pipeline that tests and packages it on every change.',
    ['Docker', 'CI/CD', 'Linux', 'Git', 'Kubernetes', 'Python'],
    [
      'Write a Dockerfile for a small service that runs as a non-root user.',
      'Add a Compose file with the service and its database, with a health check.',
      'Create a pipeline that runs the tests and builds the image on every push.',
      'Run the image on a local Kubernetes cluster with a deployment and a service.',
      'Document how to roll back to the previous image.'
    ],
    ['A repository with the Dockerfile, Compose file and pipeline definition', 'A passing pipeline run', 'A short runbook including rollback'],
    15,
    35
  ),
  brief(
    'infrastructure-as-code',
    'Infrastructure defined as code',
    'Describe a small network and a compute instance as code, review the plan and tear it down again.',
    ['Terraform', 'AWS', 'Azure', 'Networking', 'Linux', 'Git'],
    [
      'Draw the network: address ranges, subnets and which ports are open to whom.',
      'Write the configuration for the network and one instance, with variables for anything that differs between environments.',
      'Read the plan output and explain each resource it would create.',
      'Check the provider\'s current free-tier terms before applying anything, or validate against a local emulator instead.',
      'Destroy everything afterwards and confirm nothing is left running.'
    ],
    ['A repository with the configuration', 'An annotated plan output', 'A diagram of the network'],
    12,
    30,
    [['AWS', 'Azure']]
  ),
  brief(
    'mobile-app',
    'Habit tracker mobile app',
    'A mobile app with a few screens, local storage and data loaded from an API.',
    ['React Native', 'Flutter', 'Kotlin', 'Swift', 'JavaScript', 'REST APIs', 'Git'],
    [
      'Design three screens: list, detail and add.',
      'Build navigation between them and keep habits in local storage.',
      'Load one piece of data from a public API and handle being offline.',
      'Test the app on a small and a large screen.',
      'Record a short walkthrough of the app in use.'
    ],
    ['A public repository', 'A build that runs on an emulator or device', 'A screen recording of the main flow'],
    20,
    40,
    [['React Native', 'Flutter', 'Kotlin', 'Swift']]
  ),
  brief(
    'security-home-lab',
    'Security assessment of a practice target',
    'Assess a deliberately vulnerable application that you run yourself, and write the report.',
    ['Network Security', 'Networking', 'Linux', 'Penetration Testing', 'SIEM', 'Cryptography', 'Python'],
    [
      'Set up an intentionally vulnerable practice application on your own machine. Test nothing you do not own or have written permission to test.',
      'Map what is exposed: ports, services and versions.',
      'Find and reproduce three weaknesses, recording each step.',
      'Collect the logs your testing produced and write a rule that would have detected it.',
      'Write a report: each finding, its impact and how to fix it.'
    ],
    ['A written assessment report', 'The detection rule and the log lines it matches', 'Notes on how each weakness would be fixed'],
    15,
    35
  ),
  brief(
    'ux-case-study',
    'Design case study',
    'Take one real task people struggle with from research to a tested prototype.',
    ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Communication', 'HTML', 'CSS'],
    [
      'Interview three people about how they do the task today and note what gets in their way.',
      'Summarise the findings and state the problem in one sentence.',
      'Sketch wireframes for two different approaches.',
      'Build a clickable prototype of the stronger one.',
      'Test it with three people, record what happened and revise once.'
    ],
    ['Research notes with consent from participants', 'Wireframes and a clickable prototype', 'A written case study including what changed after testing'],
    15,
    30
  ),
  brief(
    'requirements-pack',
    'Requirements and backlog for a process change',
    'Analyse a real process, specify an improvement and turn it into a prioritised backlog.',
    ['Requirements Analysis', 'Agile', 'Communication', 'Excel', 'SQL', 'Data Visualization', 'Power BI'],
    [
      'Choose a process you can observe and map how it works today.',
      'Interview two people who take part in it and list their problems.',
      'Write requirements with acceptance criteria for an improved process.',
      'Turn them into user stories, estimate them relatively and order them.',
      'Define two measures that would show whether the change worked, and how you would collect them.'
    ],
    ['A current-state process map', 'A requirements document with acceptance criteria', 'An ordered backlog with two success measures'],
    10,
    25
  ),
  brief(
    'product-strategy-brief',
    'Product brief for a new feature',
    'Make the case for one feature: who it is for, why now, what to build first and how to tell if it worked.',
    ['Product Strategy', 'User Research', 'Agile', 'Communication', 'Leadership', 'SQL', 'Data Visualization'],
    [
      'Pick a product you use and one group of its users.',
      'Talk to three of them and write down the problem in their words.',
      'Write a one-page brief: problem, who has it, options considered and the one you recommend.',
      'Break the recommendation into a first release and what is deliberately left out.',
      'Define the measure of success and present the brief to someone for critique.'
    ],
    ['A one-page product brief', 'A first-release scope with what is excluded', 'Notes from the critique and what you changed'],
    10,
    25
  ),

  // E1 careers: one brief each for the skills that define the role. All use free tools and
  // public or synthetic data; none needs a paid account or real personal data.
  brief(
    'automated-test-suite',
    'Automated test suite for a web app and its API',
    'UI, API and load tests for an app you run locally, wired into a pipeline that blocks a broken build.',
    ['Testing', 'Selenium', 'Playwright', 'Postman', 'JMeter', 'Jenkins', 'Git', 'Python'],
    [
      'Run an open-source web app with an API on your machine and write down five user journeys worth protecting.',
      'Automate three of the journeys as browser tests with stable selectors and no fixed sleeps.',
      'Write an API test collection that checks status codes, response shape and one error case per endpoint.',
      'Write a small load test and record the response time at which errors start.',
      'Run everything in a pipeline on each commit and make a failing test stop the build.'
    ],
    ['A repository with the browser, API and load tests', 'A pipeline run that fails on a deliberately broken commit and passes after the fix', 'A short test report: what is covered, what is not, and the load result'],
    20,
    40,
    [['Selenium', 'Playwright']]
  ),
  brief(
    'batch-etl-warehouse',
    'Batch ETL pipeline into a small warehouse',
    'Load a public dataset into a star schema with a repeatable, tested pipeline and report from it.',
    ['ETL', 'Data Warehousing', 'SQL', 'Python', 'Apache Spark', 'Power BI', 'Tableau'],
    [
      'Choose an openly licensed public dataset that is updated over time and note its licence.',
      'Design a star schema: one fact table and the dimensions it needs, with keys and grain written down.',
      'Write the extract, transform and load steps so that running them twice gives the same result.',
      'Add checks for row counts, nulls in keys and duplicate facts, and make the pipeline stop when one fails.',
      'Answer three business questions with SQL against the warehouse and show them in a dashboard.'
    ],
    ['A repository with the pipeline, schema and data checks', 'A schema diagram with the grain of each table', 'A dashboard and the three SQL queries behind it'],
    20,
    40,
    [['Power BI', 'Tableau']]
  ),
  brief(
    'sensor-logger-firmware',
    'Sensor logger firmware on a microcontroller',
    'Firmware that samples a sensor on a schedule, buffers readings and reports them, with a host script to read them.',
    ['C', 'Microcontrollers', 'RTOS', 'Git', 'Python'],
    [
      'Pick a development board you have, or a free simulator, and one sensor; read its datasheet for timing and ranges.',
      'Write a C driver for the sensor and check its readings against the datasheet ranges.',
      'Split sampling, buffering and reporting into RTOS tasks and justify each priority.',
      'Handle a sensor that stops responding without freezing the other tasks.',
      'Write a Python script on the host that reads the serial output and plots it.'
    ],
    ['A repository with the firmware and the host script', 'A task diagram with priorities and timing', 'A log showing recovery from a disconnected sensor'],
    20,
    45
  ),
  brief(
    'site-analytics-audit',
    'Analytics and search audit of a small website',
    'Measure a site you control, find what stops visitors converting and recommend fixes with evidence.',
    ['Google Analytics', 'Google Tag Manager', 'SEO', 'WordPress', 'Excel', 'Data Analysis', 'Communication'],
    [
      'Set up a small site you control and define two conversions worth measuring.',
      'Install analytics through a tag manager and verify each event fires once, in preview mode.',
      'Audit the site against a public SEO guide: titles, headings, links, page speed and mobile use.',
      'Collect a few weeks of your own traffic and analyse it in a spreadsheet, stating how small the sample is.',
      'Write recommendations ranked by expected effect and effort, each tied to a finding.'
    ],
    ['A measurement plan listing events and conversions', 'An SEO audit with screenshots', 'A short report with ranked recommendations and the data behind them'],
    15,
    30
  ),
  brief(
    'company-financial-model',
    'Three-statement model of a listed company',
    "A linked income statement, balance sheet and cash-flow model built from a company's published annual report, with scenarios.",
    ['Financial Modeling', 'Excel', 'VBA', 'Statistics', 'Power BI'],
    [
      "Pick a listed company and take three years of figures from its published annual reports, citing each page.",
      'Build the three statements in a spreadsheet so that the balance sheet balances in every year.',
      'Forecast two years with stated assumptions, and test each assumption against the historical range.',
      'Add base, downside and upside scenarios, switched by a small macro or a single input cell.',
      'Summarise the result and the three assumptions it is most sensitive to.'
    ],
    ['The model workbook with sources cited', 'A one-page assumptions sheet', 'A sensitivity table and a short written summary'],
    20,
    40
  ),
  brief(
    'synthetic-fhir-analysis',
    'Analysis of synthetic patient records from an EHR',
    'Run an open-source EHR with demo data, export its records in FHIR format and report on them, without any real patient data.',
    ['EHR Systems', 'Healthcare Data Standards', 'SQL', 'Python', 'Data Analysis', 'Tableau', 'Power BI', 'Communication'],
    [
      'Run an open-source EHR such as OpenEMR locally with demo or synthetic patients, and record where the data came from.',
      'Export Patient, Encounter and Condition records through its FHIR interface.',
      'Map those FHIR resources to relational tables, with the coding systems kept.',
      'Load them with a script and check for missing codes, impossible dates and duplicate patients.',
      'Answer three questions a clinic manager might ask, such as encounters per month by condition.',
      'Present the results with the data-quality caveats stated next to each chart.'
    ],
    ['A repository with the loader and the quality checks', 'A table mapping each FHIR field to a column', 'A dashboard with caveats'],
    15,
    35,
    [['Tableau', 'Power BI']]
  )
];

/** Changes whenever a brief changes. */
export const PROJECT_BRIEFS_VERSION = crypto.createHash('sha256').update(JSON.stringify(PROJECT_BRIEFS)).digest('hex').slice(0, 12);
