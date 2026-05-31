/**
 * rankingEngine.js
 * MODULE 4 — Resource Ranking System
 *
 * Ranks filtered resources using a multi-factor scoring model:
 *   1. Skill relevance      (career priority weight)
 *   2. Career goal alignment (required vs optional skill)
 *   3. Learning difficulty   (beginner resources ranked higher for new learners)
 *   4. Resource quality      (rating, free availability)
 *
 * Produces three tiers: Top, Medium, and Advanced recommendations.
 */

'use strict';

const { loadDataset }    = require('../utils/dataLoader');
const { getPriorityLabel } = require('../utils/responseFormatter');
const logger             = require('../utils/logger');

// Scoring weights (must sum to 1.0)
const WEIGHTS = {
  skillRelevance  : 0.40,
  careerAlignment : 0.30,
  difficultyFit   : 0.15,
  resourceQuality : 0.15,
};

/**
 * Compute a composite score (0–100) for a single resource.
 *
 * @param {Object} resource     - Formatted resource object
 * @param {string} careerGoalId - Career goal ID
 * @param {string[]} missingSkills - Skills the user is missing
 * @returns {number} Score 0–100
 */
function scoreResource(resource, careerGoalId, missingSkills) {
  const careers = loadDataset('careers');
  const career  = careers[careerGoalId];

  // 1. Skill relevance — based on career priority weight (0–10 → 0–100)
  const rawPriority = resource.priority || 0;
  const skillScore  = (rawPriority / 10) * 100;

  // 2. Career alignment — required skills score higher than optional
  let alignmentScore = 0;
  if (career) {
    if (career.requiredSkills.includes(resource.skillId)) {
      alignmentScore = 100;
    } else if ((career.optionalSkills || []).includes(resource.skillId)) {
      alignmentScore = 60;
    }
  }

  // 3. Difficulty fit — beginner resources score higher (easier to start)
  const levelMap = {
    'beginner'             : 100,
    'beginner-to-advanced' : 80,
    'intermediate'         : 60,
    'advanced'             : 40,
  };
  const levelKey    = (resource.level || '').toLowerCase();
  const diffScore   = levelMap[levelKey] ?? 50;

  // 4. Resource quality — rating (0–5 → 0–100) + free bonus
  const ratingScore = resource.rating ? (resource.rating / 5) * 80 : 50;
  const freeBonus   = resource.free === true ? 20 : 0;
  const qualityScore = Math.min(100, ratingScore + freeBonus);

  const composite = (
    skillScore    * WEIGHTS.skillRelevance  +
    alignmentScore * WEIGHTS.careerAlignment +
    diffScore      * WEIGHTS.difficultyFit   +
    qualityScore   * WEIGHTS.resourceQuality
  );

  return Math.round(composite);
}

/**
 * Rank a flat list of resources and split into three tiers.
 *
 * @param {Object[]} resources   - Flat array of formatted resources
 * @param {string}   careerGoalId
 * @param {string[]} missingSkills
 * @returns {{ top: Object[], medium: Object[], advanced: Object[] }}
 */
function rankResources(resources, careerGoalId, missingSkills = []) {
  // Score every resource
  const scored = resources.map(r => ({
    ...r,
    score        : scoreResource(r, careerGoalId, missingSkills),
    priorityLabel: getPriorityLabel(r.priority || 0),
  }));

  // Sort descending by composite score
  scored.sort((a, b) => b.score - a.score);

  // Split into tiers
  const top      = scored.filter(r => r.score >= 70);
  const medium   = scored.filter(r => r.score >= 45 && r.score < 70);
  const advanced = scored.filter(r => r.score < 45);

  logger.info('Ranking complete', {
    total   : scored.length,
    top     : top.length,
    medium  : medium.length,
    advanced: advanced.length,
  });

  return { top, medium, advanced };
}

/**
 * Rank resources and also group each tier by resource type.
 *
 * @param {Object[]} resources
 * @param {string}   careerGoalId
 * @param {string[]} missingSkills
 * @returns {Object} Tiered and type-grouped recommendations
 */
function rankAndGroup(resources, careerGoalId, missingSkills = []) {
  const { top, medium, advanced } = rankResources(resources, careerGoalId, missingSkills);

  function groupByType(list) {
    return list.reduce((acc, r) => {
      const key = r.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  }

  return {
    top     : groupByType(top),
    medium  : groupByType(medium),
    advanced: groupByType(advanced),
  };
}

module.exports = { scoreResource, rankResources, rankAndGroup };
