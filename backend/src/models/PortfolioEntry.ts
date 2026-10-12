import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PortfolioVisibility = 'private' | 'shared';

/**
 * A piece of finished work the user records as evidence of skills.
 *
 * Everything on an entry is the user's own statement. SkillBridge does not open the link, check
 * who made the work or judge its quality, so an entry is never "assessed" evidence.
 */
export interface IPortfolioEntry extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  title: string;
  description: string;
  /** Canonical skill names the work used. */
  skills: string[];
  /** The day the work was finished, as stated by the user. */
  completedOn: Date;
  /** Where the work can be seen. Only entries with a link earn evidence points. */
  evidenceUrl?: string | null;
  /** The practice project this entry came from, when it did. */
  sourceProjectId?: Types.ObjectId | null;
  /** "shared" entries appear on the user's public portfolio page while sharing is switched on. */
  visibility: PortfolioVisibility;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioEntrySchema = new Schema<IPortfolioEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    skills: { type: [String], default: [] },
    completedOn: { type: Date, required: true },
    evidenceUrl: { type: String, default: null },
    sourceProjectId: { type: Schema.Types.ObjectId, ref: 'LearningProject', default: null },
    visibility: { type: String, enum: ['private', 'shared'], default: 'private' }
  },
  { timestamps: true }
);

/** Whether a user's shared entries are reachable by link, and under which unguessable token. */
export interface IPortfolioShare extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  enabled: boolean;
  token: string | null;
  /** Show the owner's name on the public page. Off unless the user turns it on. */
  showName: boolean;
}

const PortfolioShareSchema = new Schema<IPortfolioShare>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enabled: { type: Boolean, default: false },
    token: { type: String, default: null, index: true },
    showName: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PortfolioEntry: Model<IPortfolioEntry> =
  (mongoose.models.PortfolioEntry as Model<IPortfolioEntry>) || mongoose.model<IPortfolioEntry>('PortfolioEntry', PortfolioEntrySchema);
export const PortfolioShare: Model<IPortfolioShare> =
  (mongoose.models.PortfolioShare as Model<IPortfolioShare>) || mongoose.model<IPortfolioShare>('PortfolioShare', PortfolioShareSchema);
export default PortfolioEntry;
