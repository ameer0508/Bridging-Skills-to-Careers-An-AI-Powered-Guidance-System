import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRefreshToken extends Document<Types.ObjectId> {
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  replacedByToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    replacedByToken: { type: String }
  },
  { timestamps: true }
);

// TTL index: MongoDB removes the session document once it has expired.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshToken> =
  (mongoose.models.RefreshToken as Model<IRefreshToken>) ||
  mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
