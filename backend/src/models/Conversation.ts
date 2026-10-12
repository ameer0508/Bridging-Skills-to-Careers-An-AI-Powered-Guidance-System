import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IConversation extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId?: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career' },
    title: { type: String, default: 'New Conversation' }
  },
  { timestamps: true }
);

export const Conversation: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
