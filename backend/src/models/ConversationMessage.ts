import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationMessage extends Document {
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ConversationMessage = mongoose.models.ConversationMessage || mongoose.model<IConversationMessage>('ConversationMessage', ConversationMessageSchema);
export default ConversationMessage;
