import mongoose from 'mongoose';
import { CareerMatch } from '../models/CareerMatch.js';
import { User } from '../models/User.js';
import { UserSkill } from '../models/UserSkill.js';
import LearningProject from '../models/LearningProject.js';
import { PortfolioEntry } from '../models/PortfolioEntry.js';
import CareerScenarioService from './CareerScenarioService.js';
import { NBA_WEIGHTS, rankNextActions } from './NextBestAction.js';
import { marketEvidenceForCareers } from './CareerMarketEvidence.js';
import { SCORING_VERSION, taxonomyVersion } from '../utils/versions.js';

export const MAX_NEXT_ACTIONS = 5;

/** Loads a user's state and ranks their next actions for one career. */
class NextBestActionService {
  public async forUser(userId: string, requestedCareerId?: string) {
    const uid = new mongoose.Types.ObjectId(userId);
    const base = {
      weights: NBA_WEIGHTS,
      scoringVersion: SCORING_VERSION,
      taxonomyVersion: taxonomyVersion(),
      note:
        'Ranked by a fixed formula: the hypothetical change in your match score, plus points for required skills and for fitting your weekly hours, minus points when a skill must be learnt first. Market demand is not used because no market data is available. Scores are hypothetical and do not predict hiring outcomes.'
    };

    let careerId = requestedCareerId;
    const user = await User.findById(uid).select('targetRole learningPreferences').lean();
    if (!careerId) {
      const matches = await CareerMatch.find({ userId: uid })
        .sort({ matchScore: -1, confidence: -1, _id: 1 })
        .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } | null }>('careerId', 'title');
      const target = (user?.targetRole || '').trim().toLowerCase();
      const preferred = matches.find(m => m.careerId && m.careerId.title.toLowerCase() === target) || matches[0];
      careerId = preferred?.careerId?._id.toString();
    }
    if (!careerId) return { ...base, hasProfile: false, career: null, scoreNow: null, totalCandidates: 0, actions: [] };

    const { skills, career, requirementKeys } = await CareerScenarioService.context(userId, careerId);
    if (skills.length === 0) {
      return { ...base, hasProfile: false, career: { id: career.id, title: career.title }, scoreNow: null, totalCandidates: 0, actions: [] };
    }

    const [userSkills, projects, entries] = await Promise.all([
      UserSkill.find({ userId: uid }).populate('skillId'),
      LearningProject.find({ userId: uid }),
      PortfolioEntry.find({ userId: uid }).select('sourceProjectId')
    ]);
    const inPortfolio = new Set(entries.map(e => e.sourceProjectId?.toString()).filter(Boolean));

    const market = (await marketEvidenceForCareers([{ id: career.id, title: career.title }])).get(career.id) ?? null;
    const ranked = rankNextActions({
      market,
      skills,
      requirements: career.requirements,
      requirementKeys,
      hoursPerWeek: user?.learningPreferences?.hoursPerWeek ?? null,
      verifiedSkills: userSkills
        .filter(us => us.evidences.some(e => e.sourceType === 'assessment'))
        .map(us => (us.skillId as unknown as { canonicalName?: string } | null)?.canonicalName || '')
        .filter(Boolean),
      briefStatus: Object.fromEntries(projects.map(p => [p.briefId, p.status])),
      unpublishedProjects: projects.filter(p => p.status === 'completed' && !inPortfolio.has(p._id.toString())).map(p => ({ id: p._id.toString(), title: p.title, skills: p.targetSkills }))
    });

    return {
      ...base,
      hasProfile: true,
      career: { id: career.id, title: career.title },
      scoreNow: ranked.scoreNow,
      totalCandidates: ranked.actions.length,
      actions: ranked.actions.slice(0, MAX_NEXT_ACTIONS)
    };
  }
}

export default new NextBestActionService();
