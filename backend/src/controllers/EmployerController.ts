import { Request, Response, NextFunction } from 'express';
import EmployerPostingService, { DISCLOSURE, LIMITS, SALARY_BOUNDS } from '../services/employer/EmployerPostingService.js';
import { CONTRIBUTION_TERMS_VERSION, CONTRIBUTION_USES, EMPLOYMENT_TYPES, INDIAN_STATES, WORK_MODES } from '../models/EmployerPosting.js';
import { REPORT_REASONS } from '../models/EmployerPostingReport.js';
import { AppError } from '../middlewares/errorHandler.js';

/** What an organization agrees to when it publishes, shown in full before it does. */
export const CONTRIBUTION_TERMS = {
  version: CONTRIBUTION_TERMS_VERSION,
  summary:
    'By publishing, you confirm that you are authorised to post for this organization and that the posting describes a real, open position. You allow SkillBridge, at no charge and without time limit, to use the posting as follows.',
  uses: {
    display_to_signed_in_users: 'Show the posting, with your organization name, to signed-in SkillBridge users until it closes.',
    retain_after_closing: 'Keep its title, organization, place, dates, pay range and recognised skills after it closes, as market history. The description is not kept in the market records.',
    count_postings_by_role_and_place: 'Count postings by role, place and month.',
    advertised_salary_statistics: 'Include its pay range in advertised-salary statistics (medians and ranges with sample sizes).',
    skill_frequency_from_text: 'Count how often skills appear, read from its title, description and skill list.',
    demand_forecasting: 'Use those counts to test and publish cautious demand forecasts.',
    personalised_recommendations: "Use those statistics in signed-in users' career recommendations.",
  } satisfies Record<(typeof CONTRIBUTION_USES)[number], string>,
  withdrawal:
    'You can withdraw a posting at any time: it disappears at once from listings and from every market figure. Deleting your account withdraws all your postings.',
  verification: 'SkillBridge does not verify organizations. Postings are labelled as self-declared.',
};

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};
const ok = (res: Response, data: unknown, status = 200): void => {
  res.status(status).json({ success: true, data });
};

const queryString = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > 80) throw new AppError('Invalid query.', 400, 'VALIDATION_ERROR');
  return value.trim() || undefined;
};

class EmployerController {
  terms = handle(async (req, res) => {
    userIdOf(req);
    ok(res, {
      terms: CONTRIBUTION_TERMS,
      disclosure: DISCLOSURE,
      limits: LIMITS,
      salaryBounds: SALARY_BOUNDS,
      options: { states: INDIAN_STATES, workModes: WORK_MODES, employmentTypes: EMPLOYMENT_TYPES, reportReasons: REPORT_REASONS },
    });
  });

  getOrganization = handle(async (req, res) => ok(res, { organization: await EmployerPostingService.getProfile(userIdOf(req)) }));
  saveOrganization = handle(async (req, res) => ok(res, { organization: await EmployerPostingService.saveProfile(userIdOf(req), req.body) }));

  listMine = handle(async (req, res) => ok(res, { postings: await EmployerPostingService.listMine(userIdOf(req)) }));
  create = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.create(userIdOf(req), req.body) }, 201));
  update = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.update(userIdOf(req), req.params.id, req.body) }));
  remove = handle(async (req, res) => {
    await EmployerPostingService.removeDraft(userIdOf(req), req.params.id);
    ok(res, { deleted: true });
  });
  publish = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.publish(userIdOf(req), req.params.id, req.body) }));
  close = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.close(userIdOf(req), req.params.id) }));
  withdraw = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.withdraw(userIdOf(req), req.params.id) }));

  listOpen = handle(async (req, res) => {
    userIdOf(req);
    const extra = Object.keys(req.query).filter(k => !['skill', 'state'].includes(k));
    if (extra.length) throw new AppError(`Unknown query parameter: ${extra.join(', ')}`, 400, 'VALIDATION_ERROR');
    ok(res, await EmployerPostingService.listOpen({ skill: queryString(req.query.skill), state: queryString(req.query.state) }));
  });
  report = handle(async (req, res) => ok(res, await EmployerPostingService.report(userIdOf(req), req.params.id, req.body), 201));

  listReported = handle(async (_req, res) => ok(res, { postings: await EmployerPostingService.listReported() }));
  hide = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.moderate(req.params.id, 'hide') }));
  restore = handle(async (req, res) => ok(res, { posting: await EmployerPostingService.moderate(req.params.id, 'restore') }));
}

export default new EmployerController();
