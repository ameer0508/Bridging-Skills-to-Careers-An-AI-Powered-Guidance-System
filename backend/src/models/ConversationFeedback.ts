import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationFeedback extends Document {
  conversationId: string;
  rating: number;
  comment?: string;
  timestamp?: Date;
}

const ConversationFeedbackSchema = new Schema<IConversationFeedback>(
  {
    conversationId: { type: String, required: true, index: true },
    rating: { type: Number, required: true },
    comment: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ConversationFeedback = mongoose.models.ConversationFeedback || mongoose.model<IConversationFeedback>('ConversationFeedback', ConversationFeedbackSchema);
export default ConversationFeedback;
