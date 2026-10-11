import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationContextSnapshot extends Document {
  conversationId: string;
  context?: Record<string, any>;
  timestamp?: Date;
}

const ConversationContextSnapshotSchema = new Schema<IConversationContextSnapshot>(
  {
    conversationId: { type: String, required: true, index: true },
    context: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ConversationContextSnapshot = mongoose.models.ConversationContextSnapshot || mongoose.model<IConversationContextSnapshot>('ConversationContextSnapshot', ConversationContextSnapshotSchema);
export default ConversationContextSnapshot;
