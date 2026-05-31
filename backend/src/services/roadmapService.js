/**
 * Roadmap Service
 * Core roadmap generation engine.
 * Compares user's current skills against a target role's required skills
 * and returns a filtered, personalized weekly learning plan.
 */

const { getRoadmapByRole, getSupportedRoles } = require('../utils/roadmapData');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generates a personalized roadmap based on current skills and target role.
 *
 * Logic:
 *  1. Look up the predefined roadmap for the target role.
 *  2. Normalize the user's current skills to lowercase for comparison.
 *  3. Filter out weeks whose topics the user already knows.
 *  4. Re-number the remaining weeks sequentially.
 *  5. Return the filtered roadmap with metadata.
 *
 * @param {string[]} currentSkills - Array of skills the user already has
 * @param {string} targetRole - The job role the user wants to achieve
 * @returns {object} Generated roadmap result
 */
const generateRoadmap = (currentSkills, targetRole) => {
  const roadmapData = getRoadmapByRole(targetRole);

  if (!roadmapData) {
    const supported = getSupportedRoles().join(', ');
    throw new AppError(
      `No roadmap found for role: "${targetRole}". Supported roles: ${supported}`,
      404
    );
  }

  // Normalize user skills to lowercase for case-insensitive comparison
  const normalizedUserSkills = currentSkills.map((s) => s.toLowerCase().trim());

  // Filter steps: skip topics the user already knows
  const filteredSteps = roadmapData.steps.filter((step) => {
    const topicLower = step.topic.toLowerCase();
    // Check if any user skill is a substring of the topic or vice versa
    return !normalizedUserSkills.some(
      (skill) => topicLower.includes(skill) || skill.includes(topicLower)
    );
  });

  // Re-number weeks sequentially after filtering
  const renumberedSteps = filteredSteps.map((step, index) => ({
    ...step,
    week: index + 1,
  }));

  // Identify which required skills the user already has
  const alreadyKnown = roadmapData.requiredSkills.filter((skill) =>
    normalizedUserSkills.some(
      (userSkill) => userSkill.includes(skill) || skill.includes(userSkill)
    )
  );

  // Skills still to learn
  const skillsToLearn = roadmapData.requiredSkills.filter(
    (skill) => !alreadyKnown.includes(skill)
  );

  return {
    targetRole,
    currentSkills,
    alreadyKnownSkills: alreadyKnown,
    skillsToLearn,
    totalWeeks: renumberedSteps.length,
    roadmap: renumberedSteps,
    // Future hook: isAIEnhanced: false
  };
};

/**
 * Returns all supported roles for the roadmap engine.
 * @returns {string[]} Array of role names
 */
const getAvailableRoles = () => getSupportedRoles();

module.exports = { generateRoadmap, getAvailableRoles };
