/**
 * responseFormatter.js
 * Formats raw recommendation data into clean, structured JSON
 * ready for API consumption by the backend.
 */

'use strict';

/**
 * Build a standardised API success response envelope.
 *
 * @param {Object} data    - The payload to wrap
 * @param {string} message - Optional human-readable message
 * @returns {Object} Formatted response object
 */
function successResponse(data, message = 'Recommendations generated successfully') {
  return {
    success  : true,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Build a standardised API error response envelope.
 *
 * @param {string} message - Error description
 * @param {number} code    - Optional error code
 * @returns {Object} Formatted error object
 */
function errorResponse(message, code = 400) {
  return {
    success  : false,
    message,
    code,
    timestamp: new Date().toISOString(),
    data     : null,
  };
}

/**
 * Format a single resource item for output.
 * Strips internal fields and ensures consistent shape.
 *
 * @param {Object} resource  - Raw resource object
 * @param {string} type      - Resource type: 'course' | 'certification' | 'practicePlatform' | 'documentation'
 * @param {string} skillId   - The skill this resource belongs to
 * @param {number} priority  - Computed priority score
 * @returns {Object} Formatted resource
 */
function formatResource(resource, type, skillId, priority = 0) {
  return {
    title   : resource.title,
    provider: resource.provider || resource.type || null,
    url     : resource.url || null,
    free    : resource.free !== undefined ? resource.free : null,
    level   : resource.level || resource.cost || null,
    duration: resource.durationHours
      ? `${resource.durationHours} hours`
      : resource.duration || null,
    rating  : resource.rating || null,
    type,
    skillId,
    priority,
    priorityLabel: getPriorityLabel(priority),
  };
}

/**
 * Convert a numeric priority score to a human-readable label.
 *
 * @param {number} priority
 * @returns {string} 'High' | 'Medium' | 'Low'
 */
function getPriorityLabel(priority) {
  if (priority >= 8) return 'High';
  if (priority >= 5) return 'Medium';
  return 'Low';
}

/**
 * Group a flat list of formatted resources by their type.
 *
 * @param {Object[]} resources - Flat array of formatted resources
 * @returns {Object} Resources grouped by type
 */
function groupByType(resources) {
  return resources.reduce((acc, r) => {
    const key = r.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
}

/**
 * Sort resources within each type group by priority (descending).
 *
 * @param {Object} grouped - Output of groupByType()
 * @returns {Object} Same structure, sorted
 */
function sortGroupedByPriority(grouped) {
  const sorted = {};
  Object.keys(grouped).forEach(type => {
    sorted[type] = [...grouped[type]].sort((a, b) => b.priority - a.priority);
  });
  return sorted;
}

module.exports = {
  successResponse,
  errorResponse,
  formatResource,
  getPriorityLabel,
  groupByType,
  sortGroupedByPriority,
};
