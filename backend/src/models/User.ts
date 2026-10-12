import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** What the user has told SkillBridge about how they study. Nothing here is assumed for them. */
export interface ILearningPreferences {
  /** Hours a week the user says they can study; absent until they set it. */
  hoursPerWeek?: number | null;
  /** In-app reminders. Off until the user switches them on. */
  reminders?: boolean;
  /** In-app milestone notifications. Off until the user switches them on. */
  milestoneNotifications?: boolean;
}

export interface IUser extends Document<Types.ObjectId> {
  fullName?: string;
  name?: string;
  email: string;
  passwordHash?: string;
  accountStatus?: string;
  status?: string;
  role?: string;
  primaryCareerDomain?: string;
  secondaryCareerDomains?: string[];
  targetCareerId?: Types.ObjectId | null;
  targetRole?: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date;
  profileCompleted?: boolean;
  experienceLevel?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  avatarUrl?: string;
  lastLogin?: Date;
  learningPreferences?: ILearningPreferences;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String },
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    accountStatus: { type: String, default: 'active' },
    status: { type: String, default: 'active' },
    role: { type: String, default: 'user' },
    primaryCareerDomain: { type: String, default: '' },
    secondaryCareerDomains: { type: [String], default: [] },
    targetCareerId: { type: Schema.Types.ObjectId, ref: 'Career' },
    targetRole: { type: String, default: '' },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date },
    profileCompleted: { type: Boolean, default: false },
    experienceLevel: { type: String, default: 'entry' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    lastLogin: { type: Date },
    learningPreferences: {
      hoursPerWeek: { type: Number, min: 1, max: 60, default: null },
      reminders: { type: Boolean, default: false },
      milestoneNotifications: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  // Mongoose types the serialised object loosely; `any` is required by its transform signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? String(ret._id) : ret.id;
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export default User;
