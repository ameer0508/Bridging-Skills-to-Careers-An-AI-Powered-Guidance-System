import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface IConversationMessage extends Document<Types.ObjectId> {
  conversationId: Types.ObjectId;
  role: ConversationRole;
  content: string;
  contextSnapshotId?: Types.ObjectId;
  // True when the AI provider was unavailable and a canned notice was stored instead
  isFallback: boolean;
  /** 'ai' for a provider reply, 'fallback' for the built-in summary shown when AI is unavailable. */
  source?: 'ai' | 'fallback';
  /** Provider and model that wrote an AI reply; absent for fallbacks and user messages. */
  aiProvider?: string;
  aiModel?: string;
  /** Why a fallback was shown. 'busy': the local model was at capacity and refused at once. */
  fallbackReason?: 'unavailable' | 'timeout' | 'error' | 'busy';
  /** Set when older history was left out so the prompt fits the model's context window. */
  contextTrimmed?: { droppedMessages: number; keptMessages: number };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    contextSnapshotId: { type: Schema.Types.ObjectId, ref: 'ConversationContextSnapshot' },
    isFallback: { type: Boolean, default: false },
    source: { type: String, enum: ['ai', 'fallback'] },
    aiProvider: { type: String },
    aiModel: { type: String },
    fallbackReason: { type: String, enum: ['unavailable', 'timeout', 'error', 'busy'] },
    contextTrimmed: {
      type: new Schema({ droppedMessages: { type: Number, required: true }, keptMessages: { type: Number, required: true } }, { _id: false }),
      default: undefined
    }
  },
  { timestamps: true }
);

export const ConversationMessage: Model<IConversationMessage> =
  (mongoose.models.ConversationMessage as Model<IConversationMessage>) ||
  mongoose.model<IConversationMessage>('ConversationMessage', ConversationMessageSchema);
export default ConversationMessage;
