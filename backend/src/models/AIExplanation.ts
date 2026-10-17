import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { CareerMatchExplanationFacts } from '../services/AIClientService.js';

/**
 * The latest local-AI explanation of one of a user's results (one per user, subject and career).
 *
 * It keeps the exact facts the model was given, so the user can see what the text was based on, and
 * their hash, so the explanation is shown as out of date once the result changes. The facts are the
 * minimal sheet built from the stored match (skill names, statuses and counts); no resume text.
 * Removed with the account (AccountDeletionService finds every model with a userId).
 */
export interface IAIExplanation extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  subject: 'career_match';
  careerId: Types.ObjectId;
  factsHash: string;
  facts: CareerMatchExplanationFacts;
  text: string;
  aiProvider: string;
  aiModel: string;
  promptVersion: string;
  latencyMs: number;
  usage: { promptTokens: number; completionTokens: number; source: string };
  createdAt: Date;
  updatedAt: Date;
}

const AIExplanationSchema = new Schema<IAIExplanation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: ['career_match'], required: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    factsHash: { type: String, required: true },
    facts: { type: Schema.Types.Mixed, required: true },
    text: { type: String, required: true },
    aiProvider: { type: String, required: true },
    aiModel: { type: String, required: true },
    promptVersion: { type: String, required: true },
    latencyMs: { type: Number, default: 0 },
    usage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      source: { type: String, default: 'unavailable' },
    },
  },
  { timestamps: true }
);

AIExplanationSchema.index({ userId: 1, subject: 1, careerId: 1 }, { unique: true });

export const AIExplanation: Model<IAIExplanation> =
  (mongoose.models.AIExplanation as Model<IAIExplanation>) ||
  mongoose.model<IAIExplanation>('AIExplanation', AIExplanationSchema);
export default AIExplanation;
