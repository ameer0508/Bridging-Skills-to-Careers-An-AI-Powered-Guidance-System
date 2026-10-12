import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { MarketDataset } from '../config/marketSources.js';

export type SalaryPeriod = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export const SALARY_PERIODS: SalaryPeriod[] = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'];

export interface IPostingSalary {
  min: number | null;
  max: number | null;
  /** ISO 4217 code exactly as the source stated it; amounts are never converted. */
  currency: string;
  period: SalaryPeriod;
}

export interface IAlsoSeenIn {
  sourceId: string;
  sourceRecordId: string | null;
  seenAt: Date;
}

/**
 * One job posting as observed in a registered market source. Duplicates are merged: the same
 * source record seen again updates lastSeenAt, and the same posting found in another source is
 * recorded in alsoSeenIn. The description is not kept, only the skills read from it.
 */
export interface IMarketPosting extends Document<Types.ObjectId> {
  dataset: MarketDataset;
  sourceId: string;
  sourceRecordId: string | null;
  fingerprint: string;
  title: string;
  company: string;
  locationText: string;
  /** ISO 3166-1 alpha-2, upper case; empty when the source did not say. */
  country: string;
  remote: boolean | null;
  /** When the employer published it; null when the source gave no date (excluded from history). */
  postedAt: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  observationCount: number;
  skills: string[];
  salary: IPostingSalary | null;
  importBatchId: Types.ObjectId;
  alsoSeenIn: IAlsoSeenIn[];
  createdAt: Date;
  updatedAt: Date;
}

const SalarySchema = new Schema<IPostingSalary>(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, required: true },
    period: { type: String, enum: SALARY_PERIODS, required: true },
  },
  { _id: false }
);

const AlsoSeenInSchema = new Schema<IAlsoSeenIn>(
  { sourceId: String, sourceRecordId: { type: String, default: null }, seenAt: Date },
  { _id: false }
);

const MarketPostingSchema = new Schema<IMarketPosting>(
  {
    dataset: { type: String, enum: ['sourced', 'synthetic_fixture'], required: true },
    sourceId: { type: String, required: true },
    sourceRecordId: { type: String, default: null },
    fingerprint: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, default: '' },
    locationText: { type: String, default: '' },
    country: { type: String, default: '' },
    remote: { type: Boolean, default: null },
    postedAt: { type: Date, default: null },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    observationCount: { type: Number, default: 1 },
    skills: { type: [String], default: [] },
    salary: { type: SalarySchema, default: null },
    importBatchId: { type: Schema.Types.ObjectId, ref: 'MarketImportBatch', required: true },
    alsoSeenIn: { type: [AlsoSeenInSchema], default: [] },
  },
  { timestamps: true }
);

MarketPostingSchema.index({ dataset: 1, fingerprint: 1 }, { unique: true });
MarketPostingSchema.index(
  { sourceId: 1, sourceRecordId: 1 },
  { unique: true, partialFilterExpression: { sourceRecordId: { $type: 'string' } } }
);
MarketPostingSchema.index({ dataset: 1, postedAt: 1 });
MarketPostingSchema.index({ dataset: 1, skills: 1, postedAt: 1 });

export const MarketPosting: Model<IMarketPosting> =
  (mongoose.models.MarketPosting as Model<IMarketPosting>) ||
  mongoose.model<IMarketPosting>('MarketPosting', MarketPostingSchema);
export default MarketPosting;
