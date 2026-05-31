/**
 * Central Route Registry
 * All API routes are registered here and mounted in app.js.
 * Future modules can be plugged in by adding their routes below.
 */

const express = require('express');
const router = express.Router();

// ── Active Routes ──────────────────────────────────────────────────────────────
const profileRoutes = require('./profileRoutes');
const roadmapRoutes = require('./roadmapRoutes');

router.use('/profile', profileRoutes);
router.use('/roadmap', roadmapRoutes);

// ── Future Integration Stubs ───────────────────────────────────────────────────
// These routes are reserved for upcoming AI modules.
// Uncomment and implement when the respective modules are ready.

// const resumeRoutes = require('./resumeRoutes');
// router.use('/resume', resumeRoutes);
// → POST /api/resume/parse   — Resume parsing & extraction
// → GET  /api/resume/:id     — Retrieve parsed resume data

// const skillGapRoutes = require('./skillGapRoutes');
// router.use('/skill-gap', skillGapRoutes);
// → POST /api/skill-gap/analyze  — AI-powered skill gap analysis
// → GET  /api/skill-gap/:userId  — Get skill gap report for a user

// const resourceRoutes = require('./resourceRoutes');
// router.use('/resources', resourceRoutes);
// → GET  /api/resources          — Get learning resources
// → GET  /api/resources/:role    — Get resources filtered by role

// const recommendationRoutes = require('./recommendationRoutes');
// router.use('/recommendations', recommendationRoutes);
// → GET  /api/recommendations/:userId — AI-powered career recommendations

module.exports = router;
