/**
 * Curated starting points for learning a skill: official documentation and first-party
 * tutorials only. No durations, ratings or outcome claims are attached, because none are
 * measured. Skill names must match the shared skill lexicon.
 */
export interface SeedResource {
  title: string;
  provider: string;
  url: string;
  type: 'Documentation' | 'Tutorial' | 'Guide';
  targetSkills: string[];
  difficulty: 'Beginner' | 'Intermediate';
}

const doc = (
  skill: string,
  title: string,
  provider: string,
  url: string,
  type: SeedResource['type'] = 'Documentation',
  difficulty: SeedResource['difficulty'] = 'Beginner'
): SeedResource => ({ title, provider, url, type, targetSkills: [skill], difficulty });

export const LEARNING_RESOURCES: SeedResource[] = [
  doc('HTML', 'HTML: Structuring the web', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Learn/HTML', 'Tutorial'),
  doc('CSS', 'CSS: Styling the web', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Learn/CSS', 'Tutorial'),
  doc('JavaScript', 'JavaScript Guide', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'Guide'),
  doc('TypeScript', 'The TypeScript Handbook', 'TypeScript', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'Guide'),
  doc('React', 'React: Quick Start', 'React', 'https://react.dev/learn', 'Tutorial'),
  doc('Node.js', 'Introduction to Node.js', 'Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'Tutorial'),
  doc('REST APIs', 'HTTP overview and API basics', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'Guide'),
  doc('Python', 'The Python Tutorial', 'Python Software Foundation', 'https://docs.python.org/3/tutorial/', 'Tutorial'),
  doc('Java', 'Learn Java', 'Oracle (dev.java)', 'https://dev.java/learn/', 'Tutorial'),
  doc('SQL', 'PostgreSQL Tutorial: The SQL Language', 'PostgreSQL', 'https://www.postgresql.org/docs/current/tutorial-sql.html', 'Tutorial'),
  doc('MongoDB', 'MongoDB Manual: Getting Started', 'MongoDB', 'https://www.mongodb.com/docs/manual/tutorial/getting-started/', 'Tutorial'),
  doc('Git', 'Pro Git (free book)', 'git-scm.com', 'https://git-scm.com/book/en/v2', 'Guide'),
  doc('Docker', 'Docker: Get Started', 'Docker', 'https://docs.docker.com/get-started/', 'Tutorial'),
  doc('Kubernetes', 'Kubernetes Basics', 'Kubernetes', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'Tutorial', 'Intermediate'),
  doc('CI/CD', 'GitHub Actions documentation', 'GitHub', 'https://docs.github.com/en/actions', 'Documentation', 'Intermediate'),
  doc('Terraform', 'Terraform Tutorials', 'HashiCorp', 'https://developer.hashicorp.com/terraform/tutorials', 'Tutorial', 'Intermediate'),
  doc('AWS', 'Getting Started with AWS', 'Amazon Web Services', 'https://aws.amazon.com/getting-started/', 'Guide'),
  doc('Azure', 'Azure Fundamentals learning path', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/training/azure/', 'Tutorial'),
  doc('Linux', 'Linux command line for beginners', 'Ubuntu', 'https://ubuntu.com/tutorials/command-line-for-beginners', 'Tutorial'),
  doc('Machine Learning', 'Machine Learning Crash Course', 'Google for Developers', 'https://developers.google.com/machine-learning/crash-course', 'Tutorial', 'Intermediate'),
  doc('Deep Learning', 'Learn the Basics', 'PyTorch', 'https://pytorch.org/tutorials/beginner/basics/intro.html', 'Tutorial', 'Intermediate'),
  doc('PyTorch', 'PyTorch Tutorials', 'PyTorch', 'https://pytorch.org/tutorials/', 'Tutorial', 'Intermediate'),
  doc('TensorFlow', 'TensorFlow Tutorials', 'TensorFlow', 'https://www.tensorflow.org/tutorials', 'Tutorial', 'Intermediate'),
  doc('scikit-learn', 'scikit-learn: Getting Started', 'scikit-learn', 'https://scikit-learn.org/stable/getting_started.html', 'Tutorial', 'Intermediate'),
  doc('Pandas', 'Getting started with pandas', 'pandas', 'https://pandas.pydata.org/docs/getting_started/index.html', 'Tutorial'),
  doc('NumPy', 'NumPy: the absolute basics for beginners', 'NumPy', 'https://numpy.org/doc/stable/user/absolute_beginners.html', 'Tutorial'),
  doc('Statistics', 'Statistics and probability', 'Khan Academy', 'https://www.khanacademy.org/math/statistics-probability', 'Tutorial'),
  doc('Power BI', 'Power BI learning paths', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', 'Tutorial'),
  doc('Tableau', 'Tableau free training videos', 'Tableau', 'https://www.tableau.com/learn/training', 'Tutorial'),
  doc('Excel', 'Excel help and learning', 'Microsoft', 'https://support.microsoft.com/en-us/excel', 'Guide'),
  doc('React Native', 'React Native: Getting Started', 'React Native', 'https://reactnative.dev/docs/getting-started', 'Tutorial'),
  doc('Flutter', 'Learn Flutter', 'Flutter', 'https://docs.flutter.dev/get-started/learn-flutter', 'Tutorial'),
  doc('Kotlin', 'Kotlin: Get started', 'Kotlin', 'https://kotlinlang.org/docs/getting-started.html', 'Tutorial'),
  doc('Swift', 'The Swift Programming Language', 'Swift.org', 'https://docs.swift.org/swift-book/documentation/the-swift-programming-language/', 'Guide'),
  doc('Testing', 'Jest: Getting Started', 'Jest', 'https://jestjs.io/docs/getting-started', 'Tutorial'),
  doc('Network Security', 'OWASP Top Ten', 'OWASP', 'https://owasp.org/www-project-top-ten/', 'Guide', 'Intermediate'),
  doc('Penetration Testing', 'OWASP Web Security Testing Guide', 'OWASP', 'https://owasp.org/www-project-web-security-testing-guide/', 'Guide', 'Intermediate'),
  doc('Figma', 'Figma Learn', 'Figma', 'https://help.figma.com/hc/en-us', 'Guide'),
  doc('Agile', 'The Agile Coach', 'Atlassian', 'https://www.atlassian.com/agile', 'Guide'),

  // E1 careers (QA, data engineering, embedded, marketing, finance, health informatics).
  // Each URL resolved with HTTP 200 and the expected page title on 2026-10-13. Verilog, VHDL,
  // Communication, Data Analysis, Financial Modeling, SAS and EHR Systems have no free first-party
  // starting point that fits these rules, so those gaps are named without a resource.
  doc('Selenium', 'Getting started with WebDriver', 'Selenium', 'https://www.selenium.dev/documentation/webdriver/getting_started/', 'Tutorial'),
  doc('Playwright', 'Playwright: Installation and first test', 'Playwright', 'https://playwright.dev/docs/intro', 'Tutorial'),
  doc('Postman', 'Get started in Postman', 'Postman', 'https://learning.postman.com/docs/getting-started/overview/', 'Tutorial'),
  doc('Jenkins', 'Jenkins tutorials', 'Jenkins', 'https://www.jenkins.io/doc/tutorials/', 'Tutorial', 'Intermediate'),
  doc('Jira', 'Get started with Jira', 'Atlassian', 'https://www.atlassian.com/software/jira/guides/getting-started/introduction', 'Guide'),
  doc('Appium', 'Appium quickstart', 'Appium', 'https://appium.io/docs/en/latest/quickstart/', 'Tutorial', 'Intermediate'),
  doc('JMeter', 'JMeter user manual: Getting started', 'Apache JMeter', 'https://jmeter.apache.org/usermanual/get-started.html', 'Guide', 'Intermediate'),
  doc('Data Warehousing', 'What is a data warehouse?', 'Google Cloud', 'https://cloud.google.com/learn/what-is-a-data-warehouse', 'Guide'),
  doc('ETL', 'Extract, transform, load (ETL)', 'Microsoft Learn (Azure Architecture Center)', 'https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl', 'Guide', 'Intermediate'),
  doc('Apache Spark', 'Spark quick start', 'Apache Spark', 'https://spark.apache.org/docs/latest/quick-start.html', 'Tutorial', 'Intermediate'),
  doc('Kafka', 'Apache Kafka quickstart', 'Apache Kafka', 'https://kafka.apache.org/quickstart/', 'Tutorial', 'Intermediate'),
  doc('Hadoop', 'Hadoop: Setting up a single node cluster', 'Apache Hadoop', 'https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/SingleCluster.html', 'Tutorial', 'Intermediate'),
  doc('C', 'GNU C Language Intro and Reference Manual', 'GNU Project', 'https://www.gnu.org/software/c-intro-and-ref/manual/', 'Guide'),
  doc('C++', 'Get started with C++', 'Standard C++ Foundation (isocpp.org)', 'https://isocpp.org/get-started', 'Guide'),
  doc('Microcontrollers', 'Arduino documentation: Learn', 'Arduino', 'https://docs.arduino.cc/learn/', 'Tutorial'),
  doc('RTOS', 'FreeRTOS documentation', 'FreeRTOS', 'https://www.freertos.org/Documentation/00-Overview', 'Documentation', 'Intermediate'),
  doc('MATLAB', 'MATLAB Onramp', 'MathWorks', 'https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted', 'Tutorial'),
  doc('Google Analytics', 'Set up Analytics for a website and/or app', 'Google Analytics Help', 'https://support.google.com/analytics/answer/9304153', 'Guide'),
  doc('SEO', 'SEO Starter Guide', 'Google Search Central', 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 'Guide'),
  doc('Google Ads', 'Your guide to Google Ads', 'Google Ads Help', 'https://support.google.com/google-ads/answer/6146252', 'Guide'),
  doc('Google Tag Manager', 'Create an account and container', 'Tag Manager Help', 'https://support.google.com/tagmanager/answer/14842164', 'Guide'),
  doc('WordPress', 'Learn WordPress', 'WordPress.org', 'https://learn.wordpress.org/', 'Tutorial'),
  doc('VBA', 'Getting started with VBA in Office', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/getting-started-with-vba-in-office', 'Guide'),
  doc('SAP', 'SAP Learning', 'SAP', 'https://learning.sap.com/', 'Tutorial'),
  doc('R', 'An Introduction to R', 'The R Project (CRAN)', 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html', 'Guide'),
  doc('Healthcare Data Standards', 'FHIR overview', 'HL7', 'https://www.hl7.org/fhir/overview.html', 'Documentation', 'Intermediate')
];
