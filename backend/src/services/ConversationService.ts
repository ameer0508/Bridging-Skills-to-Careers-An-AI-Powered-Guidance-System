import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { ConversationMessage } from '../models/ConversationMessage.js';
import { ConversationContextSnapshot } from '../models/ConversationContextSnapshot.js';
import ContextAssembler from './ContextAssembler.js';
import PromptBuilder from './PromptBuilder.js';
import AIClientService from './AIClientService.js';
import logger from '../config/logger.js';

export class ConversationService {
  
  public async getConversations(userId: string) {
    return await Conversation.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean();
  }

  public async getConversationHistory(conversationId: string, userId: string) {
    const conv = await Conversation.findOne({ _id: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) });
    if (!conv) throw new Error('Conversation not found');

    const messages = await ConversationMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean();
    return { conversation: conv, messages };
  }

  public async createConversation(userId: string, careerId?: string, title: string = 'New Conversation') {
    const conv = await Conversation.create({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: careerId ? new mongoose.Types.ObjectId(careerId) : undefined,
      title
    });
    return conv;
  }

  public async switchCareer(conversationId: string, userId: string, careerId: string) {
    const conv = await Conversation.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) },
      { careerId: new mongoose.Types.ObjectId(careerId) },
      { new: true }
    );
    if (!conv) throw new Error('Conversation not found');

    // Add a system message notifying context switch
    await ConversationMessage.create({
      conversationId: conv._id,
      role: 'system',
      content: `Context switched to career target ID: ${careerId}. Subsequent responses will be grounded in this new context.`
    });

    return conv;
  }

  public async sendMessage(conversationId: string, userId: string, messageContent: string) {
    const conv = await Conversation.findOne({ _id: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) });
    if (!conv) throw new Error('Conversation not found');

    // 1. Save User Message
    await ConversationMessage.create({
      conversationId: conv._id,
      role: 'user',
      content: messageContent
    });

    // 2. Assemble verified context
    const contextData = await ContextAssembler.assembleContext(userId, conv.careerId?.toString());
    
    // Save Context Snapshot for explainability audit trail
    const snapshot = await ConversationContextSnapshot.create({
      conversationId: conv._id,
      userId: new mongoose.Types.ObjectId(userId),
      careerId: conv.careerId,
      contextData
    });

    // 3. Retrieve recent conversation history for LLM
    const recentMessages = await ConversationMessage.find({ conversationId: conv._id, role: { $ne: 'system' } })
      .sort({ createdAt: -1 })
      .limit(10) // Only pass the last 10 messages for token limits
      .lean();
    
    recentMessages.reverse(); // put in chronological order

    // 4. Build Prompts
    const systemPrompt = PromptBuilder.buildSystemPrompt(contextData);
    
    const formattedHistory = recentMessages.map(m => ({
      role: m.role as string,
      content: m.content
    }));

    // Transform 'assistant' back to 'model' for Google SDK compatibility
    const sdkHistory = formattedHistory.map(m => ({
      role: (m.role === 'assistant' ? 'model' : m.role) as 'user' | 'model',
      content: m.content
    }));

    // 5. Invoke AI
    // Note: Our AIClientService has a generateContent method. We might need a generateChatResponse if it expects history.
    // For MVP, we can concat history into the prompt if our SDK service doesn't have a chat method yet, 
    // or we can add a chat method to AIClientService. Let's add it to AIClientService or format a large prompt.
    // Let's format a large prompt for safety without editing AIClientService heavily if it lacks it.
    let fullPrompt = `${systemPrompt}\n\n=== CONVERSATION HISTORY ===\n`;
    sdkHistory.forEach(m => {
       fullPrompt += `[${m.role.toUpperCase()}]: ${m.content}\n`;
    });
    fullPrompt += `\n[ASSISTANT]: `;

    let aiResponseText: string;
    try {
      // Assuming AIClientService has the base text generation
      aiResponseText = await AIClientService.generateContent(fullPrompt);
    } catch (error) {
      logger.error('Error calling AI service for chat: ' + error);
      aiResponseText = "I'm sorry, I'm having trouble analyzing your intelligence data right now. Please try again later.";
    }

    // 6. Save AI Response
    const aiMessage = await ConversationMessage.create({
      conversationId: conv._id,
      role: 'assistant',
      content: aiResponseText,
      contextSnapshotId: snapshot._id
    });

    // Update conversation timestamp
    conv.updatedAt = new Date();
    // Auto-generate title if this is the first real exchange
    if (recentMessages.length <= 2 && conv.title === 'New Conversation') {
       // Simple title extraction or just set it
       conv.title = messageContent.substring(0, 30) + '...';
    }
    await conv.save();

    return aiMessage;
  }
}

export default new ConversationService();
