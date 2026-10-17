import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * The latest local-AI explanation of one of a user's results (one per user, subject and career):
 * a career match, readiness, skill gaps or the next-best action.
 *
 * It keeps the exact facts the model was given, so the user can see what the text was based on, and
 * their hash, so the explanation is shown as out of date once the result changes. The facts are the
 * minimal sheet built from the stored match (skill names, statuses and counts); no resume text.
 * Removed with the account (AccountDeletionService finds every model with a userId).
 */
export const EXPLANATION_SUBJECTS = ['career_match', 'readiness', 'skill_gap', 'next_action'] as const;
export type ExplanationSubject = (typeof EXPLANATION_SUBJECTS)[number];

export interface IAIExplanation extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  subject: ExplanationSubject;
  careerId: Types.ObjectId;
  factsHash: string;
  facts: Record<string, unknown>;
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
    subject: { type: String, enum: EXPLANATION_SUBJECTS, required: true },
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
