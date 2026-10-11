import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';

export interface ISavedOpportunity extends Document {
  userId: any;
  title: string;
  company: string;
  location?: string;
  url?: string;
  salary?: string;
  status: ApplicationStatus;
  savedAt?: Date;
}

const SavedOpportunitySchema = new Schema<ISavedOpportunity>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: '' },
    url: { type: String, default: '' },
    salary: { type: String, default: '' },
    status: { type: String, default: 'saved' },
    savedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const SavedOpportunity = mongoose.models.SavedOpportunity || mongoose.model<ISavedOpportunity>('SavedOpportunity', SavedOpportunitySchema);
export default SavedOpportunity;
