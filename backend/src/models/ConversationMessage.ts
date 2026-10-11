import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface IConversationMessage extends Document<Types.ObjectId> {
  conversationId: Types.ObjectId;
  role: ConversationRole;
  content: string;
  contextSnapshotId?: Types.ObjectId;
  // True when the AI provider was unavailable and a canned notice was stored instead
  isFallback: boolean;
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
    isFallback: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ConversationMessage: Model<IConversationMessage> =
  (mongoose.models.ConversationMessage as Model<IConversationMessage>) ||
  mongoose.model<IConversationMessage>('ConversationMessage', ConversationMessageSchema);
export default ConversationMessage;
