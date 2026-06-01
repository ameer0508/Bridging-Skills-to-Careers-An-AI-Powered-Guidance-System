/**
 * Central Route Registry — all API routes registered here.
 */
const express = require('express');
const router = express.Router();

const profileRoutes   = require('./profileRoutes');
const roadmapRoutes   = require('./roadmapRoutes');
const skillGapRoutes  = require('./skillGapRoutes');
const resourceRoutes  = require('./resourceRoutes');
const resumeRoutes    = require('./resumeRoutes');

router.use('/profile',   profileRoutes);
router.use('/roadmap',   roadmapRoutes);
router.use('/skill-gap', skillGapRoutes);
router.use('/resources', resourceRoutes);
router.use('/resume',    resumeRoutes);

module.exports = router;
