import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IConversationFeedback extends Document<Types.ObjectId> {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  isHelpful: boolean;
  feedbackText: string;
  createdAt: Date;
}

const ConversationFeedbackSchema = new Schema<IConversationFeedback>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'ConversationMessage',
      required: true,
      index: true
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isHelpful: { type: Boolean, required: true },
    feedbackText: { type: String, default: '' }
  },
  { timestamps: true }
);

export const ConversationFeedback: Model<IConversationFeedback> =
  (mongoose.models.ConversationFeedback as Model<IConversationFeedback>) ||
  mongoose.model<IConversationFeedback>('ConversationFeedback', ConversationFeedbackSchema);
export default ConversationFeedback;
