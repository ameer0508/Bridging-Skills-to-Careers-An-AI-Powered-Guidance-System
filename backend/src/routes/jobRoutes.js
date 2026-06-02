/**
 * Job Recommendation Routes — personalized job matching
 */
'use strict';
const express    = require('express');
const { body }   = require('express-validator');
const validate   = require('../middleware/validate');
const { sendSuccess } = require('../utils/responseHelper');
const aiClient   = require('../utils/aiClient');

const router = express.Router();

// Static job database — realistic entries per role
const JOB_DB = {
  'frontend developer': [
    { title:'Senior Frontend Engineer', company:'Stripe', location:'Remote', salary:'$130K–$180K', requiredSkills:['React','TypeScript','CSS','Git'], match:0 },
    { title:'React Developer', company:'Vercel', location:'Remote', salary:'$110K–$150K', requiredSkills:['React','JavaScript','Next.js','Git'], match:0 },
    { title:'UI Engineer', company:'Linear', location:'Remote', salary:'$120K–$160K', requiredSkills:['React','TypeScript','Tailwind CSS'], match:0 },
    { title:'Frontend Developer', company:'Notion', location:'San Francisco', salary:'$115K–$155K', requiredSkills:['React','JavaScript','CSS'], match:0 },
    { title:'JavaScript Engineer', company:'Shopify', location:'Remote', salary:'$100K–$145K', requiredSkills:['JavaScript','React','Node.js'], match:0 },
  ],
  'backend developer': [
    { title:'Backend Engineer', company:'GitHub', location:'Remote', salary:'$135K–$185K', requiredSkills:['Node.js','Python','SQL','Docker'], match:0 },
    { title:'API Engineer', company:'Twilio', location:'Remote', salary:'$120K–$165K', requiredSkills:['Node.js','REST APIs','MongoDB'], match:0 },
    { title:'Software Engineer – Backend', company:'Cloudflare', location:'Remote', salary:'$140K–$190K', requiredSkills:['Node.js','Rust','SQL'], match:0 },
    { title:'Node.js Developer', company:'Prisma', location:'Remote', salary:'$105K–$145K', requiredSkills:['Node.js','TypeScript','PostgreSQL'], match:0 },
  ],
  'full stack developer': [
    { title:'Full Stack Engineer', company:'Linear', location:'Remote', salary:'$130K–$175K', requiredSkills:['React','Node.js','TypeScript','SQL'], match:0 },
    { title:'Software Engineer', company:'Loom', location:'Remote', salary:'$140K–$185K', requiredSkills:['React','Node.js','MongoDB','AWS'], match:0 },
    { title:'Full Stack Developer', company:'Retool', location:'Remote', salary:'$120K–$160K', requiredSkills:['React','Node.js','SQL','Docker'], match:0 },
  ],
  'data analyst': [
    { title:'Data Analyst', company:'Airbnb', location:'Remote', salary:'$95K–$130K', requiredSkills:['Python','SQL','Tableau','Statistics'], match:0 },
    { title:'Business Intelligence Analyst', company:'HubSpot', location:'Remote', salary:'$85K–$120K', requiredSkills:['SQL','Python','Power BI'], match:0 },
    { title:'Analytics Engineer', company:'dbt Labs', location:'Remote', salary:'$100K–$140K', requiredSkills:['SQL','Python','dbt','Git'], match:0 },
    { title:'Product Analyst', company:'Figma', location:'Remote', salary:'$110K–$150K', requiredSkills:['SQL','Python','Statistics','Tableau'], match:0 },
  ],
  'machine learning engineer': [
    { title:'ML Engineer', company:'OpenAI', location:'San Francisco', salary:'$180K–$280K', requiredSkills:['Python','PyTorch','Machine Learning','Docker'], match:0 },
    { title:'AI/ML Engineer', company:'DeepMind', location:'London', salary:'$160K–$240K', requiredSkills:['Python','TensorFlow','Machine Learning'], match:0 },
    { title:'MLOps Engineer', company:'Weights & Biases', location:'Remote', salary:'$140K–$200K', requiredSkills:['Python','Docker','MLOps','AWS'], match:0 },
    { title:'Research Engineer', company:'Hugging Face', location:'Remote', salary:'$150K–$220K', requiredSkills:['Python','PyTorch','NLP','Machine Learning'], match:0 },
  ],
  'cybersecurity analyst': [
    { title:'Security Engineer', company:'Crowdstrike', location:'Remote', salary:'$130K–$175K', requiredSkills:['Cybersecurity','Python','Linux','SIEM'], match:0 },
    { title:'Penetration Tester', company:'NCC Group', location:'Remote', salary:'$110K–$155K', requiredSkills:['Cybersecurity','Networking','Python'], match:0 },
    { title:'SOC Analyst', company:'Palo Alto Networks', location:'Remote', salary:'$90K–$130K', requiredSkills:['Cybersecurity','SIEM','Linux'], match:0 },
  ],
  'default': [
    { title:'Software Engineer', company:'Various', location:'Remote', salary:'$90K–$150K', requiredSkills:['Git','JavaScript','Python'], match:0 },
    { title:'Junior Developer', company:'Various', location:'Remote', salary:'$70K–$100K', requiredSkills:['JavaScript','Git'], match:0 },
  ],
};

function computeJobMatch(userSkills, jobSkills) {
  if (!jobSkills.length) return 0;
  const u = new Set(userSkills.map(s => s.toLowerCase()));
  const matched = jobSkills.filter(s => u.has(s.toLowerCase())).length;
  return Math.round((matched / jobSkills.length) * 100);
}

/**
 * POST /api/jobs/recommend
 * { skills: [], targetRole: '' }
 */
router.post('/recommend',
  [body('skills').isArray(), body('targetRole').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { skills = [], targetRole } = req.body;
      const roleKey = targetRole.toLowerCase().trim();

      // Find matching job pool
      let pool = JOB_DB[roleKey] || JOB_DB.default;
      // Also include default jobs
      if (roleKey !== 'default') pool = [...pool, ...JOB_DB.default];

      // Score each job
      const scored = pool.map(job => ({
        ...job,
        match: computeJobMatch(skills, job.requiredSkills),
        difficulty: job.match < 30 ? 'High' : job.match < 70 ? 'Medium' : 'Low',
      })).sort((a, b) => b.match - a.match);

      return sendSuccess(res, 200, 'Job recommendations generated', {
        targetRole,
        userSkills: skills,
        jobs: scored,
        totalJobs: scored.length,
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
