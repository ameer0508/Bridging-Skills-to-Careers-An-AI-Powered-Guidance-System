/**
 * dataLoader.js
 * Utility for loading and caching JSON datasets.
 * Provides a single source of truth for all dataset access.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATASETS_DIR = path.join(__dirname, '..', 'datasets');

// In-memory cache to avoid repeated disk reads
const _cache = {};

/**
 * Load a JSON dataset by filename (without extension).
 * Results are cached after the first load.
 *
 * @param {string} name - Dataset name, e.g. 'skills' | 'careers' | 'learning_paths'
 * @returns {Object} Parsed JSON data
 * @throws {Error} If the file does not exist or cannot be parsed
 */
function loadDataset(name) {
  if (_cache[name]) return _cache[name];

  const filePath = path.join(DATASETS_DIR, `${name}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset not found: ${filePath}`);
  }

  try {
    const raw  = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    _cache[name] = data;
    return data;
  } catch (err) {
    throw new Error(`Failed to parse dataset "${name}": ${err.message}`);
  }
}

/**
 * Load all datasets at once and return them as a bundle.
 *
 * @returns {{ skills: Object, careers: Object, learningPaths: Object }}
 */
function loadAll() {
  return {
    skills       : loadDataset('skills'),
    careers      : loadDataset('careers'),
    learningPaths: loadDataset('learning_paths'),
  };
}

/**
 * Clear the in-memory cache (useful for testing).
 */
function clearCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
}

module.exports = { loadDataset, loadAll, clearCache };
