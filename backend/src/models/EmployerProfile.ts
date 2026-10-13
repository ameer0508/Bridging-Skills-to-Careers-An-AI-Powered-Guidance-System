import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * The organization a user posts jobs for. Name and website are self-declared; the only check is
 * whether the user's sign-in e-mail domain matches the website's domain, which is shown as a
 * signal, never as verification.
 */
export interface IEmployerProfile extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  organizationName: string;
  website: string | null;
  emailDomainMatchesWebsite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    website: { type: String, default: null },
    emailDomainMatchesWebsite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const EmployerProfile: Model<IEmployerProfile> =
  (mongoose.models.EmployerProfile as Model<IEmployerProfile>) || mongoose.model<IEmployerProfile>('EmployerProfile', EmployerProfileSchema);
export default EmployerProfile;
