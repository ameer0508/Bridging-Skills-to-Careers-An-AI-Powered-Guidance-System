/**
 * Skill Decay Tracker Routes — time-based skill decay analysis
 */
'use strict';
const express  = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { sendSuccess } = require('../utils/responseHelper');

const router = express.Router();

// Decay rates per skill category (% per week of inactivity)
const DECAY_RATES = {
  'React': 3, 'JavaScript': 2, 'TypeScript': 3, 'Node.js': 2, 'Python': 1.5,
  'SQL': 1, 'MongoDB': 2, 'Machine Learning': 4, 'Docker': 3, 'AWS': 3,
  'Cybersecurity': 4, 'Git': 0.5, 'HTML': 0.5, 'CSS': 1, 'Linux': 1.5,
  'default': 2,
};

const RISK_THRESHOLDS = { high: 60, medium: 30, low: 0 };

function computeDecay(skill, lastUsedWeeksAgo, practiceFrequency = 0) {
  const rate = DECAY_RATES[skill] || DECAY_RATES.default;
  const rawDecay = lastUsedWeeksAgo * rate * (1 - practiceFrequency * 0.1);
  const decayScore = Math.min(100, Math.max(0, rawDecay));
  const retentionScore = Math.max(0, 100 - decayScore);
  const risk = decayScore >= RISK_THRESHOLDS.high ? 'High'
    : decayScore >= RISK_THRESHOLDS.medium ? 'Medium' : 'Low';
  return { skill, decayScore: Math.round(decayScore), retentionScore: Math.round(retentionScore), risk, weeksSinceUsed: lastUsedWeeksAgo };
}

function getRefreshPlan(skill, risk) {
  const plans = {
    High:   `Urgent: dedicate 3–4 hours this week to ${skill} practice on HackerRank or project work`,
    Medium: `Recommended: spend 1–2 hours reviewing ${skill} fundamentals this week`,
    Low:    `Maintenance: a quick 30-min refresher on ${skill} every 2 weeks is sufficient`,
  };
  return plans[risk] || plans.Low;
}

/**
 * POST /api/decay/analyze
 * { skills: [], lastActivity: ISO string, roadmapProgress: number }
 */
router.post('/analyze',
  [body('skills').isArray()],
  validate,
  async (req, res, next) => {
    try {
      const { skills = [], lastActivity, roadmapProgress = 0 } = req.body;

      const now = new Date();
      const last = lastActivity ? new Date(lastActivity) : new Date(now - 14 * 24 * 60 * 60 * 1000);
      const weeksInactive = Math.max(0, Math.round((now - last) / (7 * 24 * 60 * 60 * 1000)));
      const practiceFreq  = Math.min(1, roadmapProgress / 100);

      const decayResults = skills.map(skill =>
        computeDecay(skill, weeksInactive, practiceFreq)
      );

      // Overall decay score (weighted average)
      const overallDecay = decayResults.length > 0
        ? Math.round(decayResults.reduce((s, r) => s + r.decayScore, 0) / decayResults.length)
        : 0;

      const atRisk = decayResults.filter(r => r.risk !== 'Low');
      const refreshPlan = atRisk.map(r => ({
        skill: r.skill,
        risk: r.risk,
        decayScore: r.decayScore,
        action: getRefreshPlan(r.skill, r.risk),
      }));

      return sendSuccess(res, 200, 'Skill decay analysis complete', {
        weeksInactive,
        overallDecayScore: overallDecay,
        overallRisk: overallDecay >= 60 ? 'High' : overallDecay >= 30 ? 'Medium' : 'Low',
        skills: decayResults,
        atRiskSkills: atRisk.length,
        refreshPlan,
        recommendation: overallDecay > 50
          ? 'Your skills are decaying significantly. Start your roadmap immediately.'
          : overallDecay > 20
          ? 'Some skills need refreshing. Review your top missing skills this week.'
          : 'Skills are well-maintained. Keep up your current learning pace.',
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
