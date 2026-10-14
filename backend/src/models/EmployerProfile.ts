import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * The organization a user posts jobs for. Name and website are self-declared; the only automatic
 * check is whether the user's sign-in e-mail domain matches the website's domain, shown as a
 * signal, never as verification.
 *
 * Market review: an organization's postings enter the market records (and so any statistic) only
 * after an administrator has reviewed its claim. Without that, one person with several accounts
 * and invented names could manufacture "market" figures. Review is not independent verification,
 * and listings keep saying the organization is self-declared.
 */
export const MARKET_REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type MarketReviewStatus = (typeof MARKET_REVIEW_STATUSES)[number];

export interface IMarketReview {
  status: MarketReviewStatus;
  reviewedAt: Date | null;
  reviewedBy: Types.ObjectId | null;
  note: string;
}
export interface IEmployerProfile extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  organizationName: string;
  website: string | null;
  emailDomainMatchesWebsite: boolean;
  marketReview: IMarketReview;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    website: { type: String, default: null },
    emailDomainMatchesWebsite: { type: Boolean, default: false },
    marketReview: {
      status: { type: String, enum: MARKET_REVIEW_STATUSES, default: 'pending' },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      note: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const EmployerProfile: Model<IEmployerProfile> =
  (mongoose.models.EmployerProfile as Model<IEmployerProfile>) || mongoose.model<IEmployerProfile>('EmployerProfile', EmployerProfileSchema);
export default EmployerProfile;
