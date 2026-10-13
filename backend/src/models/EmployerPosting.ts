import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * First-party job postings submitted on SkillBridge by an organization's representative, with the
 * permissions they granted (docs/EMPLOYER_POSTINGS.md). The organization and its identity are
 * self-declared: SkillBridge does not verify them, and says so wherever a posting is shown.
 */

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
] as const;

export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'apprenticeship'] as const;
export const POSTING_STATUSES = ['draft', 'open', 'closed', 'withdrawn', 'hidden'] as const;
export type PostingStatus = (typeof POSTING_STATUSES)[number];

/** The uses an organization grants when it publishes. Version changes need new consent. */
export const CONTRIBUTION_TERMS_VERSION = 'employer-contribution-v1';
export const CONTRIBUTION_USES = [
  'display_to_signed_in_users',
  'retain_after_closing',
  'count_postings_by_role_and_place',
  'advertised_salary_statistics',
  'skill_frequency_from_text',
  'demand_forecasting',
  'personalised_recommendations',
] as const;

export interface IContributionConsent {
  termsVersion: string;
  uses: string[];
  authorizedToPost: boolean;
  realOpening: boolean;
  grantedAt: Date;
}

export interface IEmployerPosting extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  organizationName: string;
  title: string;
  description: string;
  city: string;
  state: string;
  workMode: (typeof WORK_MODES)[number];
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  salary: { min: number | null; max: number | null; currency: 'INR'; period: 'YEAR' | 'MONTH' } | null;
  skills: string[];
  unrecognisedSkills: string[];
  applyUrl: string | null;
  status: PostingStatus;
  consent: IContributionConsent | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  closedAt: Date | null;
  withdrawnAt: Date | null;
  hiddenAt: Date | null;
  hiddenReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IContributionConsent>(
  {
    termsVersion: { type: String, required: true },
    uses: { type: [String], required: true },
    authorizedToPost: { type: Boolean, required: true },
    realOpening: { type: Boolean, required: true },
    grantedAt: { type: Date, required: true },
  },
  { _id: false }
);

const EmployerPostingSchema = new Schema<IEmployerPosting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, enum: INDIAN_STATES, required: true },
    workMode: { type: String, enum: WORK_MODES, required: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    salary: {
      type: new Schema(
        {
          min: { type: Number, default: null },
          max: { type: Number, default: null },
          currency: { type: String, enum: ['INR'], required: true },
          period: { type: String, enum: ['YEAR', 'MONTH'], required: true },
        },
        { _id: false }
      ),
      default: null,
    },
    skills: { type: [String], default: [] },
    unrecognisedSkills: { type: [String], default: [] },
    applyUrl: { type: String, default: null },
    status: { type: String, enum: POSTING_STATUSES, default: 'draft', index: true },
    consent: { type: ConsentSchema, default: null },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    hiddenAt: { type: Date, default: null },
    hiddenReason: { type: String, default: null },
  },
  { timestamps: true }
);

EmployerPostingSchema.index({ status: 1, publishedAt: -1 });

export const EmployerPosting: Model<IEmployerPosting> =
  (mongoose.models.EmployerPosting as Model<IEmployerPosting>) || mongoose.model<IEmployerPosting>('EmployerPosting', EmployerPostingSchema);
export default EmployerPosting;
