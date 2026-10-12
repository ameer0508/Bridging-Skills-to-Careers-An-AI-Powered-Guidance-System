import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IConversationContextSnapshot extends Document<Types.ObjectId> {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  careerId?: Types.ObjectId;
  contextData: Record<string, unknown>;
  createdAt: Date;
}

const ConversationContextSnapshotSchema = new Schema<IConversationContextSnapshot>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career' },
    contextData: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ConversationContextSnapshot: Model<IConversationContextSnapshot> =
  (mongoose.models.ConversationContextSnapshot as Model<IConversationContextSnapshot>) ||
  mongoose.model<IConversationContextSnapshot>(
    'ConversationContextSnapshot',
    ConversationContextSnapshotSchema
  );
export default ConversationContextSnapshot;
