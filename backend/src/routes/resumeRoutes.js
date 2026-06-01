/**
 * Resume Routes — file upload + simulated AI parsing
 * Real parsing via Python AI module when available.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// In-memory resume store (replace with DB/S3 in production)
const resumeStore = new Map();

/**
 * POST /api/resume/upload
 * Accepts multipart form data with a resume file.
 * Simulates parsing and skill extraction.
 */
router.post('/upload', async (req, res, next) => {
  try {
    // Since we don't have multer configured, accept JSON with base64 or metadata
    const { fileName, fileSize, fileType, userId = 'anonymous' } = req.body;

    if (!fileName) {
      throw new AppError('fileName is required', 400);
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExts = ['.pdf', '.docx'];
    const ext = path.extname(fileName).toLowerCase();

    if (!allowedExts.includes(ext)) {
      throw new AppError('Only PDF and DOCX files are supported', 400);
    }

    if (fileSize && fileSize > 10 * 1024 * 1024) {
      throw new AppError('File size must be under 10MB', 400);
    }

    // Simulate AI parsing result
    const parsedData = simulateParsing(fileName);

    const resumeRecord = {
      id: `resume_${Date.now()}`,
      userId,
      fileName,
      fileSize: fileSize || 0,
      fileType: fileType || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      parsed: parsedData,
      status: 'parsed',
    };

    resumeStore.set(userId, resumeRecord);

    return sendSuccess(res, 201, 'Resume uploaded and parsed successfully', resumeRecord);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/:userId
 * Get resume data for a user.
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const record = resumeStore.get(userId);

    if (!record) {
      throw new AppError('No resume found for this user', 404);
    }

    return sendSuccess(res, 200, 'Resume retrieved', record);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/resume/:userId
 * Delete resume for a user.
 */
router.delete('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!resumeStore.has(userId)) {
      throw new AppError('No resume found for this user', 404);
    }
    resumeStore.delete(userId);
    return sendSuccess(res, 200, 'Resume deleted successfully', null);
  } catch (error) {
    next(error);
  }
});

/**
 * Simulates AI resume parsing — returns realistic extracted data.
 * In production this calls the Python AI module.
 */
function simulateParsing(fileName) {
  const skillSets = {
    frontend: ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML', 'Vite', 'Redux'],
    backend:  ['Node.js', 'Express', 'Python', 'SQL', 'MongoDB', 'REST APIs', 'Docker'],
    data:     ['Python', 'SQL', 'Pandas', 'NumPy', 'Tableau', 'Machine Learning', 'Statistics'],
    general:  ['Git', 'Agile', 'Problem Solving', 'Communication', 'Team Collaboration'],
  };

  const allSkills = [
    ...skillSets.frontend.slice(0, 3),
    ...skillSets.backend.slice(0, 3),
    ...skillSets.general.slice(0, 2),
  ];

  return {
    extractedSkills: allSkills,
    experienceYears: 3,
    educationLevel: "Bachelor's Degree",
    jobTitles: ['Software Engineer', 'Frontend Developer'],
    summary: 'Experienced software engineer with skills in full-stack development.',
    confidence: 0.87,
    parsingMethod: 'simulated', // 'ai' when Python module is connected
  };
}

module.exports = router;
