/**
 * Project Recommendation Routes — role-specific projects
 */
'use strict';
const express  = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { sendSuccess } = require('../utils/responseHelper');

const router = express.Router();

const PROJECT_DB = {
  'frontend developer': [
    { name:'Personal Portfolio Website', difficulty:'Beginner', technologies:['HTML','CSS','JavaScript'], outcomes:['DOM manipulation','Responsive design','Git workflow'], timeWeeks:1 },
    { name:'Weather Dashboard App', difficulty:'Beginner', technologies:['JavaScript','REST APIs','CSS'], outcomes:['Fetch API','Async/await','Error handling'], timeWeeks:2 },
    { name:'React Task Manager', difficulty:'Intermediate', technologies:['React','CSS','LocalStorage'], outcomes:['React hooks','State management','Component design'], timeWeeks:2 },
    { name:'E-commerce Product Page', difficulty:'Intermediate', technologies:['React','TypeScript','Tailwind CSS'], outcomes:['TypeScript interfaces','Cart logic','Responsive UI'], timeWeeks:3 },
    { name:'Full-Featured Blog Platform', difficulty:'Advanced', technologies:['Next.js','TypeScript','Tailwind CSS'], outcomes:['SSR','SEO optimization','Auth integration'], timeWeeks:4 },
  ],
  'backend developer': [
    { name:'RESTful API with Node.js', difficulty:'Beginner', technologies:['Node.js','Express','MongoDB'], outcomes:['CRUD operations','REST design','MongoDB queries'], timeWeeks:2 },
    { name:'JWT Authentication System', difficulty:'Intermediate', technologies:['Node.js','JWT','bcrypt','MongoDB'], outcomes:['Auth flow','Password security','Protected routes'], timeWeeks:2 },
    { name:'Real-time Chat API', difficulty:'Intermediate', technologies:['Node.js','Socket.io','MongoDB'], outcomes:['WebSockets','Real-time data','Event handling'], timeWeeks:3 },
    { name:'Microservices Architecture', difficulty:'Advanced', technologies:['Node.js','Docker','RabbitMQ','PostgreSQL'], outcomes:['Service isolation','Message queues','Container deployment'], timeWeeks:5 },
  ],
  'full stack developer': [
    { name:'Full Stack Todo App', difficulty:'Beginner', technologies:['React','Node.js','MongoDB'], outcomes:['MERN stack','API integration','CRUD'], timeWeeks:2 },
    { name:'Social Media Dashboard', difficulty:'Intermediate', technologies:['React','Node.js','MongoDB','JWT'], outcomes:['Auth','Real-time updates','File uploads'], timeWeeks:4 },
    { name:'E-commerce Platform', difficulty:'Advanced', technologies:['Next.js','Node.js','PostgreSQL','Stripe'], outcomes:['Payment integration','SSR','Database design'], timeWeeks:6 },
  ],
  'data analyst': [
    { name:'Sales Data Analysis', difficulty:'Beginner', technologies:['Python','Pandas','Matplotlib'], outcomes:['Data cleaning','EDA','Visualization'], timeWeeks:1 },
    { name:'Customer Segmentation', difficulty:'Intermediate', technologies:['Python','Pandas','Scikit-learn'], outcomes:['Clustering','Feature engineering','Model evaluation'], timeWeeks:2 },
    { name:'BI Dashboard in Tableau', difficulty:'Intermediate', technologies:['SQL','Tableau','Excel'], outcomes:['KPI design','Dashboard storytelling','SQL queries'], timeWeeks:2 },
    { name:'Predictive Sales Forecasting', difficulty:'Advanced', technologies:['Python','Scikit-learn','Pandas','Plotly'], outcomes:['Regression','Time series','Deployment'], timeWeeks:3 },
  ],
  'machine learning engineer': [
    { name:'Spam Email Classifier', difficulty:'Beginner', technologies:['Python','Scikit-learn','Pandas'], outcomes:['Text classification','Feature extraction','Model evaluation'], timeWeeks:2 },
    { name:'Image Classification with CNN', difficulty:'Intermediate', technologies:['Python','TensorFlow','Keras'], outcomes:['Deep learning','CNN architecture','Transfer learning'], timeWeeks:3 },
    { name:'Sentiment Analysis API', difficulty:'Intermediate', technologies:['Python','NLTK','Flask','Scikit-learn'], outcomes:['NLP','API deployment','Model serving'], timeWeeks:3 },
    { name:'Recommendation System', difficulty:'Advanced', technologies:['Python','PyTorch','FastAPI','Docker'], outcomes:['Collaborative filtering','Model deployment','Scalability'], timeWeeks:4 },
  ],
  'cybersecurity analyst': [
    { name:'Network Port Scanner', difficulty:'Beginner', technologies:['Python','Socket','Nmap'], outcomes:['Network protocols','Port scanning','Automation'], timeWeeks:1 },
    { name:'Password Strength Analyzer', difficulty:'Beginner', technologies:['Python','Regex'], outcomes:['Security patterns','Input validation'], timeWeeks:1 },
    { name:'Vulnerable Web App (DVWA)', difficulty:'Intermediate', technologies:['Linux','Python','Burp Suite'], outcomes:['OWASP Top 10','Penetration testing','Reporting'], timeWeeks:3 },
    { name:'SIEM Log Analyzer', difficulty:'Advanced', technologies:['Python','Elastic Stack','Linux'], outcomes:['Log parsing','Anomaly detection','Alerting'], timeWeeks:4 },
  ],
  'default': [
    { name:'Personal Portfolio', difficulty:'Beginner', technologies:['HTML','CSS','JavaScript'], outcomes:['Web fundamentals','Git'], timeWeeks:1 },
    { name:'CRUD Application', difficulty:'Intermediate', technologies:['Python/JS','Database'], outcomes:['Backend basics','API design'], timeWeeks:2 },
  ],
};

function matchProjectToUser(project, userSkills, missingSkills) {
  const u = new Set(userSkills.map(s => s.toLowerCase()));
  const m = new Set(missingSkills.map(s => s.toLowerCase()));
  const techLower = project.technologies.map(t => t.toLowerCase());
  const techCovered = techLower.filter(t => u.has(t) || Array.from(u).some(s => t.includes(s) || s.includes(t))).length;
  const techGap     = techLower.filter(t => m.has(t) || Array.from(m).some(s => t.includes(s) || s.includes(t))).length;
  const relevance   = Math.round(((techCovered + techGap) / Math.max(techLower.length, 1)) * 100);
  return { ...project, relevance, techCovered, techGap };
}

/**
 * POST /api/projects/recommend
 * { skills: [], targetRole: '', missingSkills: [] }
 */
router.post('/recommend',
  [body('skills').isArray(), body('targetRole').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { skills = [], targetRole, missingSkills = [] } = req.body;
      const roleKey = targetRole.toLowerCase().trim();
      const pool = PROJECT_DB[roleKey] || PROJECT_DB.default;

      const projects = pool
        .map(p => matchProjectToUser(p, skills, missingSkills))
        .sort((a, b) => b.relevance - a.relevance);

      return sendSuccess(res, 200, 'Project recommendations generated', {
        targetRole,
        userSkills: skills,
        projects,
        totalProjects: projects.length,
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
