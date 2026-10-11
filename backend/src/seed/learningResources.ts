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
  doc('Agile', 'The Agile Coach', 'Atlassian', 'https://www.atlassian.com/agile', 'Guide')
];
