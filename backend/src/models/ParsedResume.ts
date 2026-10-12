import mongoose, { Schema, Document, Model, Types, SchemaDefinitionProperty } from 'mongoose';

/** A value extracted from the resume together with its extraction metadata. */
export interface IExtractedEntity {
  value?: string;
  confidence?: number;
  source?: string;
  extraction_method?: string;
  [key: string]: unknown;
}

export interface IParsedExperience {
  company?: IExtractedEntity | null;
  role?: IExtractedEntity | null;
  duration?: IExtractedEntity | null;
  responsibilities?: IExtractedEntity[];
}

export interface IParsedProject {
  name?: IExtractedEntity | null;
  description?: IExtractedEntity | null;
  technologies?: IExtractedEntity[];
  contributions?: IExtractedEntity[];
}

export interface IParsedEducation {
  institution?: IExtractedEntity | null;
  degree?: IExtractedEntity | null;
  branch?: IExtractedEntity | null;
  endYear?: IExtractedEntity | null;
  gpa?: IExtractedEntity | null;
}

export interface ISectionHealth {
  sectionName: string;
  iconName: string;
  score: number;
  status: string;
  qualitativeConfidence: string;
  extractionMethod: string;
  description: string;
}

export interface IParsedResume extends Document<Types.ObjectId> {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  personalInfo: Record<string, IExtractedEntity | null | undefined>;
  education: IParsedEducation[];
  experience: IParsedExperience[];
  projects: IParsedProject[];
  certifications: IExtractedEntity[];
  achievements: IExtractedEntity[];
  languages: IExtractedEntity[];
  interests: IExtractedEntity[];
  atsScore: number;
  sectionHealth: ISectionHealth[];
  createdAt: Date;
  updatedAt: Date;
}

// The nested resume sections come straight from the AI service and are stored as-is;
// they are always written as whole arrays, never mutated in place.
const mixedList = <T>() =>
  ({ type: [Schema.Types.Mixed], default: [] }) as unknown as SchemaDefinitionProperty<T[]>;

const ParsedResumeSchema = new Schema<IParsedResume>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personalInfo: { type: Schema.Types.Mixed, default: {} },
    education: mixedList<IParsedEducation>(),
    experience: mixedList<IParsedExperience>(),
    projects: mixedList<IParsedProject>(),
    certifications: mixedList<IExtractedEntity>(),
    achievements: mixedList<IExtractedEntity>(),
    languages: mixedList<IExtractedEntity>(),
    interests: mixedList<IExtractedEntity>(),
    atsScore: { type: Number, default: 0 },
    sectionHealth: mixedList<ISectionHealth>()
  },
  { timestamps: true }
);

export const ParsedResume: Model<IParsedResume> =
  (mongoose.models.ParsedResume as Model<IParsedResume>) ||
  mongoose.model<IParsedResume>('ParsedResume', ParsedResumeSchema);
export default ParsedResume;
