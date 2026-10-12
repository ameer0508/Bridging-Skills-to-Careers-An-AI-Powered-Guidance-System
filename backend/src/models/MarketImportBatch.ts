import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { MarketDataset } from '../config/marketSources.js';

export interface IImportRejection {
  index: number;
  reason: string;
}

export interface IImportCounts {
  received: number;
  inserted: number;
  /** Same source record seen again: lastSeenAt advanced, nothing duplicated. */
  reobserved: number;
  /** Same posting already held from another source or under another id. */
  duplicates: number;
  /** Same source record id arriving with different content; the stored version is kept. */
  conflicts: number;
  rejected: number;
}

/** Audit record of one import: where the data came from, when, who imported it and what happened. */
export interface IMarketImportBatch extends Document<Types.ObjectId> {
  sourceId: string;
  dataset: MarketDataset;
  retrievedAt: Date;
  importedBy: Types.ObjectId;
  counts: IImportCounts;
  rejections: IImportRejection[];
  createdAt: Date;
}

const RejectionSchema = new Schema<IImportRejection>({ index: Number, reason: String }, { _id: false });

const MarketImportBatchSchema = new Schema<IMarketImportBatch>(
  {
    sourceId: { type: String, required: true },
    dataset: { type: String, enum: ['sourced', 'synthetic_fixture'], required: true },
    retrievedAt: { type: Date, required: true },
    importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    counts: {
      received: { type: Number, default: 0 },
      inserted: { type: Number, default: 0 },
      reobserved: { type: Number, default: 0 },
      duplicates: { type: Number, default: 0 },
      conflicts: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },
    rejections: { type: [RejectionSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MarketImportBatchSchema.index({ sourceId: 1, createdAt: -1 });

export const MarketImportBatch: Model<IMarketImportBatch> =
  (mongoose.models.MarketImportBatch as Model<IMarketImportBatch>) ||
  mongoose.model<IMarketImportBatch>('MarketImportBatch', MarketImportBatchSchema);
export default MarketImportBatch;
