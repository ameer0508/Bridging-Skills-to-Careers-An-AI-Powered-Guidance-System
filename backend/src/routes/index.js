/**
 * Central Route Registry
 */
'use strict';
const express = require('express');
const router  = express.Router();

router.use('/auth',      require('./authRoutes'));
router.use('/profile',   require('./profileRoutes'));
router.use('/roadmap',   require('./roadmapRoutes'));
router.use('/skill-gap', require('./skillGapRoutes'));
router.use('/resources', require('./resourceRoutes'));
router.use('/resume',    require('./resumeRoutes'));
router.use('/jobs',      require('./jobRoutes'));
router.use('/projects',  require('./projectRoutes'));
router.use('/decay',     require('./decayRoutes'));

module.exports = router;
