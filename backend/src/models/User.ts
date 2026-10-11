import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName?: string;
  name?: string;
  email: string;
  passwordHash?: string;
  accountStatus?: string;
  status?: string;
  role?: string;
  primaryCareerDomain?: string;
  secondaryCareerDomains?: string[];
  targetCareerId?: any;
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
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
