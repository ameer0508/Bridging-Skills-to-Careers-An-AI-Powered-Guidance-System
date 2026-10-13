// GENERATED FILE - keep identical to ai/app/resources/skill_lexicon.json.
// The two services are deployed separately, so each carries its own copy; a backend test
// fails if they drift apart.

export interface LexiconSkill {
  name: string;
  category: string;
  aliases: string[];
  /** Aliases that are ordinary words ("Express") and therefore need exact casing. */
  exactAliases: string[];
  /** Skills that using this one necessarily demonstrates (e.g. PostgreSQL implies SQL). */
  implies: string[];
  /** Names that are also ordinary words or single letters are matched with exact casing only. */
  caseSensitive: boolean;
}

export const SKILL_LEXICON_VERSION = 2;

export const SKILL_LEXICON: LexiconSkill[] = [
  {
    "name": "Python",
    "category": "Programming Languages",
    "aliases": [
      "python3"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "JavaScript",
    "category": "Programming Languages",
    "aliases": [
      "js",
      "es6",
      "ecmascript"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "TypeScript",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Java",
    "category": "Programming Languages",
    "aliases": [
      "core java"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "C++",
    "category": "Programming Languages",
    "aliases": [
      "cpp",
      "c plus plus"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "C#",
    "category": "Programming Languages",
    "aliases": [
      "c sharp",
      "csharp"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "C",
    "category": "Programming Languages",
    "aliases": [
      "c programming",
      "c language"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Go",
    "category": "Programming Languages",
    "aliases": [
      "golang"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Rust",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "PHP",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Ruby",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Swift",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Kotlin",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "R",
    "category": "Programming Languages",
    "aliases": [
      "r programming",
      "r language",
      "rstudio"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Dart",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Scala",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "MATLAB",
    "category": "Programming Languages",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Bash",
    "category": "Programming Languages",
    "aliases": [
      "shell scripting",
      "bash scripting",
      "shell script"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "SQL",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "HTML",
    "category": "Web",
    "aliases": [
      "html5"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "CSS",
    "category": "Web",
    "aliases": [
      "css3"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "React",
    "category": "Frontend",
    "aliases": [
      "react.js",
      "reactjs"
    ],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Next.js",
    "category": "Frontend",
    "aliases": [
      "nextjs"
    ],
    "exactAliases": [],
    "implies": [
      "React",
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Vue.js",
    "category": "Frontend",
    "aliases": [
      "vuejs"
    ],
    "exactAliases": [
      "Vue"
    ],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Angular",
    "category": "Frontend",
    "aliases": [
      "angularjs"
    ],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Redux",
    "category": "Frontend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Tailwind CSS",
    "category": "Frontend",
    "aliases": [
      "tailwind",
      "tailwindcss"
    ],
    "exactAliases": [],
    "implies": [
      "CSS"
    ],
    "caseSensitive": false
  },
  {
    "name": "Bootstrap",
    "category": "Frontend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "CSS"
    ],
    "caseSensitive": false
  },
  {
    "name": "Sass",
    "category": "Frontend",
    "aliases": [
      "scss"
    ],
    "exactAliases": [],
    "implies": [
      "CSS"
    ],
    "caseSensitive": false
  },
  {
    "name": "jQuery",
    "category": "Frontend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Webpack",
    "category": "Frontend",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Vite",
    "category": "Frontend",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Node.js",
    "category": "Backend",
    "aliases": [
      "nodejs",
      "node js"
    ],
    "exactAliases": [],
    "implies": [
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Express.js",
    "category": "Backend",
    "aliases": [
      "expressjs",
      "express js"
    ],
    "exactAliases": [
      "Express"
    ],
    "implies": [
      "Node.js",
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Django",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "Flask",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": true
  },
  {
    "name": "FastAPI",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "Spring Boot",
    "category": "Backend",
    "aliases": [
      "springboot",
      "spring framework"
    ],
    "exactAliases": [],
    "implies": [
      "Java"
    ],
    "caseSensitive": false
  },
  {
    "name": "ASP.NET",
    "category": "Backend",
    "aliases": [
      ".net",
      "dotnet",
      ".net core",
      "asp.net core"
    ],
    "exactAliases": [],
    "implies": [
      "C#"
    ],
    "caseSensitive": false
  },
  {
    "name": "Ruby on Rails",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [
      "Rails"
    ],
    "implies": [
      "Ruby"
    ],
    "caseSensitive": false
  },
  {
    "name": "Laravel",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "PHP"
    ],
    "caseSensitive": false
  },
  {
    "name": "GraphQL",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "REST APIs",
    "category": "Backend",
    "aliases": [
      "rest api",
      "restful api",
      "restful apis",
      "rest apis",
      "restful services",
      "restful web services",
      "api development"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Microservices",
    "category": "Backend",
    "aliases": [
      "microservice",
      "microservices architecture"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "gRPC",
    "category": "Backend",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "PostgreSQL",
    "category": "Databases",
    "aliases": [
      "postgres"
    ],
    "exactAliases": [],
    "implies": [
      "SQL"
    ],
    "caseSensitive": false
  },
  {
    "name": "MySQL",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "SQL"
    ],
    "caseSensitive": false
  },
  {
    "name": "SQLite",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "SQL"
    ],
    "caseSensitive": false
  },
  {
    "name": "SQL Server",
    "category": "Databases",
    "aliases": [
      "mssql",
      "ms sql",
      "microsoft sql server"
    ],
    "exactAliases": [],
    "implies": [
      "SQL"
    ],
    "caseSensitive": false
  },
  {
    "name": "Oracle Database",
    "category": "Databases",
    "aliases": [
      "oracle db",
      "pl/sql"
    ],
    "exactAliases": [],
    "implies": [
      "SQL"
    ],
    "caseSensitive": false
  },
  {
    "name": "MongoDB",
    "category": "Databases",
    "aliases": [
      "mongo db"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Redis",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Elasticsearch",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Firebase",
    "category": "Databases",
    "aliases": [
      "firestore"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "DynamoDB",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Cassandra",
    "category": "Databases",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "AWS",
    "category": "Cloud Platforms",
    "aliases": [
      "amazon web services"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Azure",
    "category": "Cloud Platforms",
    "aliases": [
      "microsoft azure"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "GCP",
    "category": "Cloud Platforms",
    "aliases": [
      "google cloud platform",
      "google cloud"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Docker",
    "category": "DevOps",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Kubernetes",
    "category": "DevOps",
    "aliases": [
      "k8s"
    ],
    "exactAliases": [],
    "implies": [
      "Docker"
    ],
    "caseSensitive": false
  },
  {
    "name": "Terraform",
    "category": "DevOps",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Jenkins",
    "category": "DevOps",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "CI/CD"
    ],
    "caseSensitive": false
  },
  {
    "name": "Ansible",
    "category": "DevOps",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "CI/CD",
    "category": "DevOps",
    "aliases": [
      "ci cd",
      "continuous integration",
      "continuous delivery",
      "continuous deployment",
      "github actions",
      "gitlab ci"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Linux",
    "category": "Operating Systems",
    "aliases": [
      "ubuntu",
      "unix"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Git",
    "category": "Tools",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "GitHub",
    "category": "Tools",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Git"
    ],
    "caseSensitive": false
  },
  {
    "name": "GitLab",
    "category": "Tools",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Git"
    ],
    "caseSensitive": false
  },
  {
    "name": "Nginx",
    "category": "DevOps",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Networking",
    "category": "Networking",
    "aliases": [
      "computer networks",
      "computer networking",
      "tcp/ip"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Machine Learning",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Deep Learning",
    "category": "AI / ML",
    "aliases": [
      "neural networks"
    ],
    "exactAliases": [],
    "implies": [
      "Machine Learning"
    ],
    "caseSensitive": false
  },
  {
    "name": "NLP",
    "category": "AI / ML",
    "aliases": [
      "natural language processing"
    ],
    "exactAliases": [],
    "implies": [
      "Machine Learning"
    ],
    "caseSensitive": false
  },
  {
    "name": "Computer Vision",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Machine Learning"
    ],
    "caseSensitive": false
  },
  {
    "name": "TensorFlow",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Deep Learning",
      "Machine Learning",
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "PyTorch",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Deep Learning",
      "Machine Learning",
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "scikit-learn",
    "category": "AI / ML",
    "aliases": [
      "sklearn",
      "scikit learn"
    ],
    "exactAliases": [],
    "implies": [
      "Machine Learning",
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "LLMs",
    "category": "AI / ML",
    "aliases": [
      "large language models",
      "generative ai",
      "genai"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Prompt Engineering",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "LangChain",
    "category": "AI / ML",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "Pandas",
    "category": "Data Science",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "NumPy",
    "category": "Data Science",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "Matplotlib",
    "category": "Data Science",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Python",
      "Data Visualization"
    ],
    "caseSensitive": false
  },
  {
    "name": "Apache Spark",
    "category": "Data Science",
    "aliases": [
      "pyspark"
    ],
    "exactAliases": [
      "Spark"
    ],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Hadoop",
    "category": "Data Science",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Kafka",
    "category": "Data Science",
    "aliases": [
      "apache kafka"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Airflow",
    "category": "Data Science",
    "aliases": [
      "apache airflow"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Tableau",
    "category": "Data Science",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Data Visualization"
    ],
    "caseSensitive": false
  },
  {
    "name": "Power BI",
    "category": "Data Science",
    "aliases": [
      "powerbi"
    ],
    "exactAliases": [],
    "implies": [
      "Data Visualization"
    ],
    "caseSensitive": false
  },
  {
    "name": "Excel",
    "category": "Data Science",
    "aliases": [
      "microsoft excel",
      "ms excel",
      "advanced excel"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Statistics",
    "category": "Data Science",
    "aliases": [
      "statistical analysis",
      "statistical modeling",
      "statistical modelling"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Data Visualization",
    "category": "Data Science",
    "aliases": [
      "data visualisation"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Data Analysis",
    "category": "Data Science",
    "aliases": [
      "data analytics"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Data Structures and Algorithms",
    "category": "Computer Science",
    "aliases": [
      "dsa",
      "data structures",
      "algorithms",
      "data structures & algorithms"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "React Native",
    "category": "Mobile",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "React",
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "Flutter",
    "category": "Mobile",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Dart"
    ],
    "caseSensitive": false
  },
  {
    "name": "Android",
    "category": "Mobile",
    "aliases": [
      "android development",
      "android studio"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "iOS",
    "category": "Mobile",
    "aliases": [
      "ios development"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "SwiftUI",
    "category": "Mobile",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Swift"
    ],
    "caseSensitive": false
  },
  {
    "name": "Testing",
    "category": "Testing",
    "aliases": [
      "unit testing",
      "test automation",
      "automated testing",
      "software testing",
      "tdd"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Jest",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing",
      "JavaScript"
    ],
    "caseSensitive": false
  },
  {
    "name": "PyTest",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing",
      "Python"
    ],
    "caseSensitive": false
  },
  {
    "name": "Selenium",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing"
    ],
    "caseSensitive": false
  },
  {
    "name": "Cypress",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing"
    ],
    "caseSensitive": false
  },
  {
    "name": "JUnit",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing",
      "Java"
    ],
    "caseSensitive": false
  },
  {
    "name": "Postman",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Network Security",
    "category": "Cybersecurity",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Penetration Testing",
    "category": "Cybersecurity",
    "aliases": [
      "pen testing",
      "pentesting",
      "ethical hacking"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Cryptography",
    "category": "Cybersecurity",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "SIEM",
    "category": "Cybersecurity",
    "aliases": [
      "splunk"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "OWASP",
    "category": "Cybersecurity",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Vulnerability Assessment",
    "category": "Cybersecurity",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Figma",
    "category": "Design",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Adobe XD",
    "category": "Design",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "User Research",
    "category": "Design",
    "aliases": [
      "ux research"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Wireframing",
    "category": "Design",
    "aliases": [
      "wireframes"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Prototyping",
    "category": "Design",
    "aliases": [
      "prototypes"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "UI Design",
    "category": "Design",
    "aliases": [
      "ui/ux",
      "ui/ux design",
      "ux design"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Agile",
    "category": "Business",
    "aliases": [
      "scrum",
      "kanban",
      "agile methodologies"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Jira",
    "category": "Business",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Product Strategy",
    "category": "Business",
    "aliases": [
      "product roadmap",
      "product management"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Requirements Analysis",
    "category": "Business",
    "aliases": [
      "requirements gathering",
      "business requirements",
      "requirement analysis"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Project Management",
    "category": "Business",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Communication",
    "category": "Soft Skills",
    "aliases": [
      "communication skills"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Leadership",
    "category": "Soft Skills",
    "aliases": [
      "team leadership"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Problem Solving",
    "category": "Soft Skills",
    "aliases": [
      "problem-solving"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Teamwork",
    "category": "Soft Skills",
    "aliases": [
      "collaboration"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Playwright",
    "category": "Testing",
    "aliases": [
      "microsoft playwright"
    ],
    "exactAliases": [],
    "implies": [
      "Testing"
    ],
    "caseSensitive": false
  },
  {
    "name": "Appium",
    "category": "Testing",
    "aliases": [],
    "exactAliases": [],
    "implies": [
      "Testing"
    ],
    "caseSensitive": false
  },
  {
    "name": "JMeter",
    "category": "Testing",
    "aliases": [
      "apache jmeter"
    ],
    "exactAliases": [],
    "implies": [
      "Testing"
    ],
    "caseSensitive": false
  },
  {
    "name": "ETL",
    "category": "Data Engineering",
    "aliases": [
      "extract transform load",
      "extract, transform, load",
      "informatica powercenter",
      "talend open studio"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Data Warehousing",
    "category": "Data Engineering",
    "aliases": [
      "data warehouse",
      "data warehouses",
      "dwh"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Microcontrollers",
    "category": "Embedded Systems",
    "aliases": [
      "microcontroller",
      "arm cortex-m",
      "stm32"
    ],
    "exactAliases": [
      "MCU"
    ],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "RTOS",
    "category": "Embedded Systems",
    "aliases": [
      "real-time operating system",
      "real time operating system",
      "freertos"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Verilog",
    "category": "Hardware Description",
    "aliases": [
      "systemverilog"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "VHDL",
    "category": "Hardware Description",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Google Analytics",
    "category": "Marketing",
    "aliases": [
      "ga4",
      "universal analytics"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "SEO",
    "category": "Marketing",
    "aliases": [
      "search engine optimization",
      "search engine optimisation"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "Google Ads",
    "category": "Marketing",
    "aliases": [
      "adwords",
      "google adwords"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Google Tag Manager",
    "category": "Marketing",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "WordPress",
    "category": "Web",
    "aliases": [],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Financial Modeling",
    "category": "Finance",
    "aliases": [
      "financial modelling",
      "financial models",
      "financial model"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "VBA",
    "category": "Programming Languages",
    "aliases": [
      "visual basic for applications",
      "excel vba"
    ],
    "exactAliases": [],
    "implies": [
      "Excel"
    ],
    "caseSensitive": true
  },
  {
    "name": "SAP",
    "category": "Enterprise Software",
    "aliases": [
      "sap erp",
      "sap s/4hana",
      "sap fico"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "SAS",
    "category": "Analytics",
    "aliases": [
      "sas programming",
      "sas base"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": true
  },
  {
    "name": "EHR Systems",
    "category": "Healthcare IT",
    "aliases": [
      "electronic health records",
      "electronic health record",
      "electronic medical records",
      "epic systems",
      "meditech",
      "eclinicalworks"
    ],
    "exactAliases": [
      "EHR",
      "EMR"
    ],
    "implies": [],
    "caseSensitive": false
  },
  {
    "name": "Healthcare Data Standards",
    "category": "Healthcare IT",
    "aliases": [
      "hl7",
      "fhir",
      "hl7 fhir",
      "icd-10",
      "snomed ct"
    ],
    "exactAliases": [],
    "implies": [],
    "caseSensitive": false
  }
];
