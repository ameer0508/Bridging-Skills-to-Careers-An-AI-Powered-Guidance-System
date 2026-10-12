import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import OpportunityController from '../controllers/OpportunityController.js';
import { requireAuth } from '../middlewares/auth.js';

/** Job searches allowed per user per minute: JOB_SEARCH_RATE_PER_MINUTE, 30 unless set to 1-600. */
export function jobSearchLimit(raw: string | undefined = process.env.JOB_SEARCH_RATE_PER_MINUTE): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 600 ? value : 30;
}

const router = Router();

router.use(requireAuth);

// Searching is limited per signed-in user, separately from the general limit per address, so one
// account cannot use up a live provider's allowance (X7). Tracking saved jobs is not limited here.
export const JOB_SEARCHES_PER_MINUTE = jobSearchLimit();
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: JOB_SEARCHES_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?.userId || 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'JOB_SEARCH_RATE_LIMITED', message: `You can search for jobs ${JOB_SEARCHES_PER_MINUTE} times a minute. Wait a moment and try again; your saved jobs are unaffected.` },
    });
  },
});

router.get('/', searchLimiter, OpportunityController.getOpportunities);
router.get('/saved', OpportunityController.getSavedOpportunities);
router.get('/telemetry', OpportunityController.getTelemetry);
router.post('/save', OpportunityController.saveOpportunity);
router.post('/:id/save', OpportunityController.saveOpportunity);
router.delete('/:id/save', OpportunityController.deleteSavedOpportunity);
router.patch('/saved/:id/status', OpportunityController.updateSavedStatus);
// Notes and follow-up reminder of a saved opportunity
router.patch('/saved/:id', OpportunityController.updateSavedDetails);
// Same operation as DELETE /:id/save, under the saved-opportunity path
router.delete('/saved/:id', OpportunityController.deleteSavedOpportunity);
router.get('/:id', OpportunityController.getOpportunityById);

export default router;
