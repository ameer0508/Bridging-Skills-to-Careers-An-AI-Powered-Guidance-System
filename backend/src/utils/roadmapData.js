/**
 * Predefined Skill Roadmaps
 * Contains structured weekly learning paths for 6 career roles.
 * Each roadmap defines the full skill progression from beginner to job-ready.
 *
 * Structure:
 *   roadmaps[roleName] = {
 *     requiredSkills: [...],   // All skills needed for this role
 *     steps: [{ week, topic, description, resources }]
 *   }
 */

const roadmaps = {
  'Frontend Developer': {
    requiredSkills: [
      'html', 'css', 'javascript', 'dom', 'react', 'state management',
      'git', 'responsive design', 'api integration', 'testing',
    ],
    steps: [
      {
        week: 1,
        topic: 'HTML Fundamentals',
        description: 'Learn semantic HTML5, forms, tables, and document structure.',
        resources: [
          'https://developer.mozilla.org/en-US/docs/Learn/HTML',
          'https://www.w3schools.com/html/',
        ],
      },
      {
        week: 2,
        topic: 'CSS & Responsive Design',
        description: 'Master CSS3, Flexbox, Grid, and responsive design with media queries.',
        resources: [
          'https://developer.mozilla.org/en-US/docs/Learn/CSS',
          'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
        ],
      },
      {
        week: 3,
        topic: 'JavaScript Essentials',
        description: 'Core JS: variables, functions, arrays, objects, ES6+ features.',
        resources: [
          'https://javascript.info/',
          'https://developer.mozilla.org/en-US/docs/Learn/JavaScript',
        ],
      },
      {
        week: 4,
        topic: 'DOM Manipulation & Events',
        description: 'Interact with the DOM, handle events, and manipulate page content dynamically.',
        resources: [
          'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model',
        ],
      },
      {
        week: 5,
        topic: 'Git & Version Control',
        description: 'Learn Git basics: commits, branches, merging, and GitHub workflows.',
        resources: [
          'https://git-scm.com/doc',
          'https://learngitbranching.js.org/',
        ],
      },
      {
        week: 6,
        topic: 'React Fundamentals',
        description: 'Components, JSX, props, state, and the React component lifecycle.',
        resources: [
          'https://react.dev/learn',
        ],
      },
      {
        week: 7,
        topic: 'State Management',
        description: 'Context API, useReducer, and introduction to Redux Toolkit.',
        resources: [
          'https://react.dev/learn/managing-state',
          'https://redux-toolkit.js.org/introduction/getting-started',
        ],
      },
      {
        week: 8,
        topic: 'API Integration',
        description: 'Fetch data from REST APIs using fetch and Axios, handle async/await.',
        resources: [
          'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
          'https://axios-http.com/docs/intro',
        ],
      },
      {
        week: 9,
        topic: 'Testing Basics',
        description: 'Unit testing with Jest and React Testing Library.',
        resources: [
          'https://jestjs.io/docs/getting-started',
          'https://testing-library.com/docs/react-testing-library/intro/',
        ],
      },
      {
        week: 10,
        topic: 'Capstone Project',
        description: 'Build a complete frontend application using all learned skills.',
        resources: [],
      },
    ],
  },

  'Backend Developer': {
    requiredSkills: [
      'javascript', 'node.js', 'express.js', 'mongodb', 'rest api',
      'authentication', 'git', 'sql', 'testing', 'deployment',
    ],
    steps: [
      {
        week: 1,
        topic: 'JavaScript & Node.js Fundamentals',
        description: 'Core JS, Node.js runtime, modules, npm, and the event loop.',
        resources: [
          'https://nodejs.org/en/docs/',
          'https://javascript.info/',
        ],
      },
      {
        week: 2,
        topic: 'Express.js & REST APIs',
        description: 'Build REST APIs with Express: routing, middleware, request/response cycle.',
        resources: [
          'https://expressjs.com/en/guide/routing.html',
        ],
      },
      {
        week: 3,
        topic: 'MongoDB & Mongoose',
        description: 'NoSQL database design, CRUD operations, schemas, and Mongoose ODM.',
        resources: [
          'https://mongoosejs.com/docs/',
          'https://www.mongodb.com/docs/',
        ],
      },
      {
        week: 4,
        topic: 'SQL Databases',
        description: 'Relational database fundamentals with PostgreSQL and basic queries.',
        resources: [
          'https://www.postgresql.org/docs/',
          'https://sqlzoo.net/',
        ],
      },
      {
        week: 5,
        topic: 'Authentication & Authorization',
        description: 'JWT, bcrypt, session management, and role-based access control.',
        resources: [
          'https://jwt.io/introduction',
        ],
      },
      {
        week: 6,
        topic: 'Input Validation & Security',
        description: 'Validate inputs, prevent injection attacks, use helmet and rate limiting.',
        resources: [
          'https://express-validator.github.io/docs/',
          'https://helmetjs.github.io/',
        ],
      },
      {
        week: 7,
        topic: 'Error Handling & Logging',
        description: 'Centralized error handling, structured logging with Winston or Morgan.',
        resources: [
          'https://expressjs.com/en/guide/error-handling.html',
        ],
      },
      {
        week: 8,
        topic: 'Testing APIs',
        description: 'Unit and integration testing with Jest and Supertest.',
        resources: [
          'https://jestjs.io/',
          'https://github.com/ladjs/supertest',
        ],
      },
      {
        week: 9,
        topic: 'Git & Deployment',
        description: 'Git workflows, CI/CD basics, and deploying to platforms like Render or Railway.',
        resources: [
          'https://git-scm.com/doc',
          'https://render.com/docs',
        ],
      },
      {
        week: 10,
        topic: 'Capstone Project',
        description: 'Build a complete REST API backend with authentication and database integration.',
        resources: [],
      },
    ],
  },

  'Full Stack Developer': {
    requiredSkills: [
      'html', 'css', 'javascript', 'react', 'node.js', 'express.js',
      'mongodb', 'rest api', 'authentication', 'deployment',
    ],
    steps: [
      {
        week: 1,
        topic: 'HTML, CSS & JavaScript Review',
        description: 'Solidify frontend fundamentals: semantic HTML, CSS Grid/Flexbox, ES6+.',
        resources: [
          'https://developer.mozilla.org/en-US/docs/Learn',
        ],
      },
      {
        week: 2,
        topic: 'React Fundamentals',
        description: 'Components, hooks (useState, useEffect), props, and routing with React Router.',
        resources: [
          'https://react.dev/learn',
        ],
      },
      {
        week: 3,
        topic: 'Node.js & Express.js',
        description: 'Server-side JavaScript, REST API design, middleware, and routing.',
        resources: [
          'https://nodejs.org/en/docs/',
          'https://expressjs.com/',
        ],
      },
      {
        week: 4,
        topic: 'MongoDB & Mongoose',
        description: 'Database design, CRUD, relationships, and Mongoose schemas.',
        resources: [
          'https://mongoosejs.com/docs/',
        ],
      },
      {
        week: 5,
        topic: 'Connecting Frontend & Backend',
        description: 'Axios/Fetch for API calls, CORS configuration, environment variables.',
        resources: [
          'https://axios-http.com/docs/intro',
        ],
      },
      {
        week: 6,
        topic: 'Authentication (Full Stack)',
        description: 'JWT auth flow: login, register, protected routes on both frontend and backend.',
        resources: [
          'https://jwt.io/introduction',
        ],
      },
      {
        week: 7,
        topic: 'State Management',
        description: 'Context API or Redux Toolkit for global state across the application.',
        resources: [
          'https://redux-toolkit.js.org/',
        ],
      },
      {
        week: 8,
        topic: 'Testing (Frontend & Backend)',
        description: 'Jest, React Testing Library, and Supertest for full-stack test coverage.',
        resources: [
          'https://jestjs.io/',
          'https://testing-library.com/',
        ],
      },
      {
        week: 9,
        topic: 'Deployment & DevOps Basics',
        description: 'Deploy frontend to Vercel, backend to Render, and configure environment variables.',
        resources: [
          'https://vercel.com/docs',
          'https://render.com/docs',
        ],
      },
      {
        week: 10,
        topic: 'Capstone Project',
        description: 'Build and deploy a complete full-stack MERN application.',
        resources: [],
      },
    ],
  },

  'Data Analyst': {
    requiredSkills: [
      'python', 'sql', 'excel', 'statistics', 'pandas', 'numpy',
      'data visualization', 'tableau', 'power bi', 'machine learning basics',
    ],
    steps: [
      {
        week: 1,
        topic: 'Python for Data Analysis',
        description: 'Python basics: variables, loops, functions, and data structures.',
        resources: [
          'https://docs.python.org/3/tutorial/',
          'https://www.learnpython.org/',
        ],
      },
      {
        week: 2,
        topic: 'SQL Fundamentals',
        description: 'SELECT, WHERE, JOIN, GROUP BY, aggregations, and subqueries.',
        resources: [
          'https://sqlzoo.net/',
          'https://mode.com/sql-tutorial/',
        ],
      },
      {
        week: 3,
        topic: 'Statistics & Probability',
        description: 'Descriptive statistics, distributions, hypothesis testing, and correlation.',
        resources: [
          'https://www.khanacademy.org/math/statistics-probability',
        ],
      },
      {
        week: 4,
        topic: 'Pandas & NumPy',
        description: 'Data manipulation, cleaning, filtering, and numerical computing.',
        resources: [
          'https://pandas.pydata.org/docs/',
          'https://numpy.org/doc/',
        ],
      },
      {
        week: 5,
        topic: 'Data Visualization',
        description: 'Create charts and graphs with Matplotlib and Seaborn.',
        resources: [
          'https://matplotlib.org/stable/tutorials/',
          'https://seaborn.pydata.org/tutorial.html',
        ],
      },
      {
        week: 6,
        topic: 'Excel for Data Analysis',
        description: 'Pivot tables, VLOOKUP, data validation, and Excel dashboards.',
        resources: [
          'https://support.microsoft.com/en-us/excel',
        ],
      },
      {
        week: 7,
        topic: 'Tableau / Power BI',
        description: 'Build interactive dashboards and business intelligence reports.',
        resources: [
          'https://help.tableau.com/current/guides/get-started-tutorial/en-us/get-started-tutorial-home.htm',
          'https://learn.microsoft.com/en-us/power-bi/',
        ],
      },
      {
        week: 8,
        topic: 'Data Cleaning & EDA',
        description: 'Exploratory Data Analysis: handling missing values, outliers, and feature engineering.',
        resources: [
          'https://pandas.pydata.org/docs/user_guide/missing_data.html',
        ],
      },
      {
        week: 9,
        topic: 'Machine Learning Basics',
        description: 'Introduction to scikit-learn: regression, classification, and model evaluation.',
        resources: [
          'https://scikit-learn.org/stable/getting_started.html',
        ],
      },
      {
        week: 10,
        topic: 'Capstone Project',
        description: 'Analyze a real-world dataset and present findings with visualizations.',
        resources: [
          'https://www.kaggle.com/datasets',
        ],
      },
    ],
  },

  'Cybersecurity Analyst': {
    requiredSkills: [
      'networking', 'linux', 'python', 'cryptography', 'ethical hacking',
      'siem', 'incident response', 'firewalls', 'vulnerability assessment', 'compliance',
    ],
    steps: [
      {
        week: 1,
        topic: 'Networking Fundamentals',
        description: 'OSI model, TCP/IP, DNS, HTTP/S, firewalls, and network protocols.',
        resources: [
          'https://www.comptia.org/certifications/network',
          'https://www.cisco.com/c/en/us/solutions/enterprise-networks/networking-basics.html',
        ],
      },
      {
        week: 2,
        topic: 'Linux for Security',
        description: 'Linux CLI, file permissions, user management, and bash scripting basics.',
        resources: [
          'https://linuxjourney.com/',
          'https://overthewire.org/wargames/bandit/',
        ],
      },
      {
        week: 3,
        topic: 'Cryptography Basics',
        description: 'Symmetric/asymmetric encryption, hashing, TLS/SSL, and PKI.',
        resources: [
          'https://www.coursera.org/learn/crypto',
        ],
      },
      {
        week: 4,
        topic: 'Ethical Hacking & Penetration Testing',
        description: 'Reconnaissance, scanning, exploitation basics with tools like Nmap and Metasploit.',
        resources: [
          'https://www.offensive-security.com/metasploit-unleashed/',
          'https://tryhackme.com/',
        ],
      },
      {
        week: 5,
        topic: 'Vulnerability Assessment',
        description: 'CVE databases, vulnerability scanning with Nessus/OpenVAS, and risk scoring.',
        resources: [
          'https://nvd.nist.gov/',
        ],
      },
      {
        week: 6,
        topic: 'SIEM & Log Analysis',
        description: 'Security Information and Event Management: Splunk, ELK Stack, log correlation.',
        resources: [
          'https://docs.splunk.com/Documentation',
        ],
      },
      {
        week: 7,
        topic: 'Incident Response',
        description: 'IR lifecycle: preparation, detection, containment, eradication, and recovery.',
        resources: [
          'https://www.nist.gov/publications/computer-security-incident-handling-guide',
        ],
      },
      {
        week: 8,
        topic: 'Firewalls & IDS/IPS',
        description: 'Configure firewalls, understand intrusion detection and prevention systems.',
        resources: [
          'https://www.pfsense.org/getting-started/',
        ],
      },
      {
        week: 9,
        topic: 'Compliance & Frameworks',
        description: 'NIST, ISO 27001, GDPR, SOC 2 — understanding security compliance.',
        resources: [
          'https://www.nist.gov/cyberframework',
        ],
      },
      {
        week: 10,
        topic: 'Capstone: CTF Challenge',
        description: 'Complete a Capture The Flag challenge to apply all learned skills.',
        resources: [
          'https://ctftime.org/',
          'https://picoctf.org/',
        ],
      },
    ],
  },

  'Machine Learning Engineer': {
    requiredSkills: [
      'python', 'mathematics', 'statistics', 'machine learning', 'deep learning',
      'tensorflow', 'pytorch', 'data preprocessing', 'model deployment', 'mlops',
    ],
    steps: [
      {
        week: 1,
        topic: 'Python for ML',
        description: 'Python essentials, NumPy, Pandas, and Matplotlib for data science.',
        resources: [
          'https://docs.python.org/3/',
          'https://numpy.org/doc/',
        ],
      },
      {
        week: 2,
        topic: 'Mathematics for ML',
        description: 'Linear algebra, calculus, and probability theory fundamentals.',
        resources: [
          'https://www.khanacademy.org/math/linear-algebra',
          'https://www.3blue1brown.com/topics/linear-algebra',
        ],
      },
      {
        week: 3,
        topic: 'Statistics & Probability',
        description: 'Distributions, Bayes theorem, hypothesis testing, and statistical inference.',
        resources: [
          'https://www.khanacademy.org/math/statistics-probability',
        ],
      },
      {
        week: 4,
        topic: 'Machine Learning Fundamentals',
        description: 'Supervised/unsupervised learning, regression, classification, clustering.',
        resources: [
          'https://scikit-learn.org/stable/user_guide.html',
          'https://www.coursera.org/learn/machine-learning',
        ],
      },
      {
        week: 5,
        topic: 'Data Preprocessing & Feature Engineering',
        description: 'Handling missing data, encoding, scaling, and feature selection.',
        resources: [
          'https://scikit-learn.org/stable/modules/preprocessing.html',
        ],
      },
      {
        week: 6,
        topic: 'Deep Learning with TensorFlow/Keras',
        description: 'Neural networks, backpropagation, CNNs, and RNNs.',
        resources: [
          'https://www.tensorflow.org/tutorials',
          'https://keras.io/guides/',
        ],
      },
      {
        week: 7,
        topic: 'PyTorch Fundamentals',
        description: 'Tensors, autograd, building and training neural networks in PyTorch.',
        resources: [
          'https://pytorch.org/tutorials/',
        ],
      },
      {
        week: 8,
        topic: 'Model Evaluation & Tuning',
        description: 'Cross-validation, hyperparameter tuning, overfitting, and regularization.',
        resources: [
          'https://scikit-learn.org/stable/modules/cross_validation.html',
        ],
      },
      {
        week: 9,
        topic: 'Model Deployment & MLOps',
        description: 'Serve models with FastAPI/Flask, Docker, and intro to MLflow.',
        resources: [
          'https://mlflow.org/docs/latest/index.html',
          'https://fastapi.tiangolo.com/',
        ],
      },
      {
        week: 10,
        topic: 'Capstone Project',
        description: 'Build, train, evaluate, and deploy an end-to-end ML model.',
        resources: [
          'https://www.kaggle.com/competitions',
        ],
      },
    ],
  },
};

/**
 * Returns a list of all supported role names.
 */
const getSupportedRoles = () => Object.keys(roadmaps);

/**
 * Retrieves the roadmap for a given role (case-insensitive).
 * @param {string} role - Target job role
 * @returns {object|null} Roadmap object or null if not found
 */
const getRoadmapByRole = (role) => {
  const normalizedRole = role.trim();
  // Try exact match first
  if (roadmaps[normalizedRole]) return roadmaps[normalizedRole];

  // Try case-insensitive match
  const key = Object.keys(roadmaps).find(
    (k) => k.toLowerCase() === normalizedRole.toLowerCase()
  );
  return key ? roadmaps[key] : null;
};

module.exports = { roadmaps, getSupportedRoles, getRoadmapByRole };
