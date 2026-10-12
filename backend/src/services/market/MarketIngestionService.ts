import crypto from 'crypto';
import { Types } from 'mongoose';
import { z } from 'zod';
import { getMarketSource } from '../../config/marketSources.js';
import MarketPosting, { SALARY_PERIODS, SalaryPeriod } from '../../models/MarketPosting.js';
import MarketImportBatch, { IImportCounts, IImportRejection, IMarketImportBatch } from '../../models/MarketImportBatch.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { extractSkills, lookupSkill } from '../../utils/skillLexicon.js';

export const MAX_POSTINGS_PER_IMPORT = 2000;
const MAX_REJECTIONS_KEPT = 200;
const EARLIEST_PLAUSIBLE_DATE = Date.UTC(2000, 0, 1);
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const isoDate = z.string().trim().refine(v => !Number.isNaN(Date.parse(v)), { message: 'is not a valid date' });

const salarySchema = z
  .object({
    min: z.number().positive().finite().nullable().optional(),
    max: z.number().positive().finite().nullable().optional(),
    currency: z.string().trim().regex(/^[A-Za-z]{3}$/, 'must be a 3-letter ISO 4217 code'),
    period: z.string().trim().transform(v => v.toUpperCase()).pipe(z.enum(SALARY_PERIODS as [string, ...string[]])),
  })
  .strict()
  .refine(s => s.min != null || s.max != null, { message: 'needs a minimum or a maximum' })
  .refine(s => s.min == null || s.max == null || s.min <= s.max, { message: 'minimum is above maximum' });

export const postingInputSchema = z
  .object({
    sourceRecordId: z.string().trim().min(1).max(200).optional(),
    title: z.string().trim().min(2).max(200),
    company: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, 'must be an ISO 3166-1 alpha-2 code').optional(),
    remote: z.boolean().optional(),
    postedAt: isoDate.optional(),
    description: z.string().max(20000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
    salary: salarySchema.optional(),
  })
  .strict();

export const importRequestSchema = z
  .object({
    sourceId: z.string().trim().min(1).max(100),
    retrievedAt: isoDate,
    // Each posting is validated on its own so one bad record does not reject the whole file
    postings: z.array(z.unknown()).min(1).max(MAX_POSTINGS_PER_IMPORT),
  })
  .strict();

export type ImportRequest = z.infer<typeof importRequestSchema>;
export type PostingInput = z.infer<typeof postingInputSchema>;

const collapse = (value: string | undefined) => (value || '').replace(/\s+/g, ' ').trim();

/**
 * Identity of a posting independent of its source: normalised title, employer, location and the
 * day it was published. Two sources listing the same job on the same day agree on it; a repost on
 * a later day is a new posting.
 */
export function postingFingerprint(p: { title: string; company?: string; location?: string; postedAt: Date | null }): string {
  const day = p.postedAt ? p.postedAt.toISOString().slice(0, 10) : 'undated';
  const key = [p.title, p.company, p.location].map(v => collapse(v).toLowerCase()).concat(day).join('|');
  return crypto.createHash('sha256').update(key).digest('hex');
}

/** Lexicon skills from the posting's own skill list, title and description. Unknown names are dropped. */
export function postingSkills(input: Pick<PostingInput, 'title' | 'description' | 'skills'>): string[] {
  const listed = (input.skills || []).map(s => lookupSkill(s)?.name).filter((s): s is string => Boolean(s));
  const read = extractSkills(`${input.title}\n${input.description || ''}`);
  return [...new Set([...listed, ...read])];
}

const describeIssues = (error: z.ZodError) => error.issues.map(i => `${i.path.join('.') || 'posting'} ${i.message}`).join('; ');

class MarketIngestionService {
  async importBatch(request: ImportRequest, importedBy: string): Promise<IMarketImportBatch> {
    const source = getMarketSource(request.sourceId);
    if (!source) {
      throw new AppError(
        `Unknown market source '${request.sourceId}'. Only registered sources with a verified licence can be imported.`,
        400,
        'UNKNOWN_SOURCE'
      );
    }
    const retrievedAt = new Date(request.retrievedAt);
    if (retrievedAt.getTime() > Date.now() + CLOCK_SKEW_MS || retrievedAt.getTime() < EARLIEST_PLAUSIBLE_DATE) {
      throw new AppError('retrievedAt must be a past date after 2000-01-01.', 400, 'VALIDATION_ERROR');
    }

    const batchId = new Types.ObjectId();
    const counts: IImportCounts = { received: request.postings.length, inserted: 0, reobserved: 0, duplicates: 0, conflicts: 0, rejected: 0 };
    const rejections: IImportRejection[] = [];
    const reject = (index: number, reason: string, kind: 'rejected' | 'conflicts' = 'rejected') => {
      counts[kind] += 1;
      if (rejections.length < MAX_REJECTIONS_KEPT) rejections.push({ index, reason });
    };

    for (const [index, raw] of request.postings.entries()) {
      const parsed = postingInputSchema.safeParse(raw);
      if (!parsed.success) {
        reject(index, describeIssues(parsed.error));
        continue;
      }
      const input = parsed.data;
      const postedAt = input.postedAt ? new Date(input.postedAt) : null;
      if (postedAt && (postedAt.getTime() > retrievedAt.getTime() + CLOCK_SKEW_MS || postedAt.getTime() < EARLIEST_PLAUSIBLE_DATE)) {
        reject(index, 'postedAt must fall between 2000-01-01 and the retrieval date');
        continue;
      }

      const fields = {
        title: collapse(input.title),
        company: collapse(input.company),
        locationText: collapse(input.location),
        country: (input.country || '').toUpperCase(),
        remote: input.remote ?? null,
        postedAt,
        skills: postingSkills(input),
        salary: input.salary
          ? { min: input.salary.min ?? null, max: input.salary.max ?? null, currency: input.salary.currency.toUpperCase(), period: input.salary.period as SalaryPeriod }
          : null,
      };
      const fingerprint = postingFingerprint({ title: fields.title, company: fields.company, location: fields.locationText, postedAt });
      const sourceRecordId = input.sourceRecordId ?? null;

      if (sourceRecordId) {
        const known = await MarketPosting.findOne({ sourceId: source.id, sourceRecordId });
        if (known) {
          if (known.fingerprint !== fingerprint) {
            reject(index, `record ${sourceRecordId} was already imported with different title, employer, location or date; the stored version is kept`, 'conflicts');
            continue;
          }
          await MarketPosting.updateOne(
            { _id: known._id },
            { $max: { lastSeenAt: retrievedAt }, $min: { firstSeenAt: retrievedAt }, $inc: { observationCount: 1 } }
          );
          counts.reobserved += 1;
          continue;
        }
      }

      const sameJob = await MarketPosting.findOne({ dataset: source.dataset, fingerprint });
      if (sameJob) {
        const alreadyLinked =
          sourceRecordId !== null &&
          sameJob.alsoSeenIn.some(s => s.sourceId === source.id && s.sourceRecordId === sourceRecordId);
        if (alreadyLinked) {
          await MarketPosting.updateOne({ _id: sameJob._id }, { $max: { lastSeenAt: retrievedAt } });
          counts.reobserved += 1;
          continue;
        }
        await MarketPosting.updateOne(
          { _id: sameJob._id },
          {
            $max: { lastSeenAt: retrievedAt },
            $min: { firstSeenAt: retrievedAt },
            $push: { alsoSeenIn: { sourceId: source.id, sourceRecordId, seenAt: retrievedAt } },
          }
        );
        counts.duplicates += 1;
        continue;
      }

      try {
        await MarketPosting.create({
          ...fields,
          dataset: source.dataset,
          sourceId: source.id,
          sourceRecordId,
          fingerprint,
          firstSeenAt: retrievedAt,
          lastSeenAt: retrievedAt,
          importBatchId: batchId,
        });
        counts.inserted += 1;
      } catch (err: unknown) {
        // A concurrent import stored the same posting first
        if ((err as { code?: number }).code === 11000) counts.duplicates += 1;
        else throw err;
      }
    }

    return MarketImportBatch.create({
      _id: batchId,
      sourceId: source.id,
      dataset: source.dataset,
      retrievedAt,
      importedBy,
      counts,
      rejections,
    });
  }

  async listBatches(limit = 50): Promise<IMarketImportBatch[]> {
    return MarketImportBatch.find().sort({ createdAt: -1 }).limit(limit);
  }
}

export default new MarketIngestionService();
