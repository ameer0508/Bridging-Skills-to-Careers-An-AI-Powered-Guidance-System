import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { ConversationMessage } from '../models/ConversationMessage.js';
import { ConversationContextSnapshot } from '../models/ConversationContextSnapshot.js';
import ContextAssembler from './ContextAssembler.js';
import PromptBuilder from './PromptBuilder.js';
import AIClientService, { AiUnavailableError } from './AIClientService.js';
import type { IConversation } from '../models/Conversation.js';
import type { IConversationMessage } from '../models/ConversationMessage.js';
import logger from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';
import { withUserAiGeneration } from './aiGenerationLock.js';

/**
 * Longest prompt, in characters, sent for a chat reply. The local model has an 8192-token context
 * and may write up to 384 tokens; the chat prompt measured 3.12 characters per token, so 3 per
 * token with a 256-token margin leaves about 22,000 characters. Older history is left out first.
 */
export const chatPromptMaxChars = (): number => Number(process.env.CHAT_PROMPT_MAX_CHARS) || 22000;

export interface BuiltChatPrompt {
  prompt: string;
  droppedMessages: number;
  keptMessages: number;
}

/**
 * The chat prompt: the system instructions with the user's own verified context, the most recent
 * history that fits, and the latest message. The instructions, the context and the latest message
 * are always kept; only older history is dropped, oldest first, and the count is reported. If even
 * those do not fit, the prompt is sent whole and the AI service refuses it as too long, so the
 * user gets a labelled fallback rather than an answer based on a silently shortened prompt.
 */
export function buildChatPrompt(
  contextData: Record<string, unknown>,
  history: Array<{ role: string; content: string }>,
  maxChars = chatPromptMaxChars()
): BuiltChatPrompt {
  const head = `${PromptBuilder.buildSystemPrompt(contextData)}\n\n=== CONVERSATION HISTORY ===\n`;
  const tail = `\n[ASSISTANT]: `;
  const lines = history.map(m => `[${m.role === 'assistant' ? 'MODEL' : 'USER'}]: ${m.content}\n`);
  let start = 0;
  let size = head.length + tail.length + lines.reduce((n, l) => n + l.length, 0);
  // Never drop the latest message (the last line)
  while (size > maxChars && start < lines.length - 1) {
    size -= lines[start].length;
    start += 1;
  }
  return { prompt: head + lines.slice(start).join('') + tail, droppedMessages: start, keptMessages: lines.length - start };
}

export class ConversationService {
  
  public async getConversations(userId: string) {
    return await Conversation.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean();
  }

  public async getConversationHistory(conversationId: string, userId: string) {
    const conv = await Conversation.findOne({ _id: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) });
    if (!conv) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

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
    if (!conv) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

    // Add a system message notifying context switch
    await ConversationMessage.create({
      conversationId: conv._id,
      role: 'system',
      content: `Context switched to career target ID: ${careerId}. Subsequent responses will be grounded in this new context.`
    });

    return conv;
  }

  public async sendMessage(conversationId: string, userId: string, messageContent: string): Promise<IConversationMessage> {
    const conv = await this.findOwnedConversation(conversationId, userId);
    return this.oneReplyAtATime(userId, () => this.storeAndAnswer(conv, userId, messageContent));
  }

  private async storeAndAnswer(conv: IConversation, userId: string, messageContent: string): Promise<IConversationMessage> {

    await ConversationMessage.create({
      conversationId: conv._id,
      role: 'user',
      content: messageContent
    });

    const reply = await this.generateReply(conv, userId);

    // Title the conversation after its first question
    if (conv.title === 'New Conversation') {
      conv.title = messageContent.length > 40 ? `${messageContent.substring(0, 40)}...` : messageContent;
    }
    conv.updatedAt = new Date();
    await conv.save();

    return reply;
  }

  /**
   * Asks again for the last question when its answer was a fallback. The fallback notice is
   * replaced by the new reply; the user's question is not stored a second time.
   */
  public async retryLastReply(conversationId: string, userId: string): Promise<IConversationMessage> {
    const conv = await this.findOwnedConversation(conversationId, userId);

    const last = await ConversationMessage.findOne({ conversationId: conv._id, role: { $ne: 'system' } }).sort({ createdAt: -1, _id: -1 });
    if (!last || last.role !== 'assistant' || !last.isFallback) {
      throw new AppError('There is no failed reply to retry in this conversation.', 409, 'NOTHING_TO_RETRY');
    }

    return this.oneReplyAtATime(userId, async () => {
      await ConversationMessage.deleteOne({ _id: last._id });
      const reply = await this.generateReply(conv, userId);
      conv.updatedAt = new Date();
      await conv.save();
      return reply;
    });
  }

  /**
   * Refuses (409) while a reply, or an explanation, for this user is still being written; nothing
   * is stored then. The lock is shared with explanations (aiGenerationLock).
   */
  private async oneReplyAtATime<T>(userId: string, work: () => Promise<T>): Promise<T> {
    return withUserAiGeneration(userId, 'chat', work);
  }

  private async findOwnedConversation(conversationId: string, userId: string): Promise<IConversation> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    const conv = await Conversation.findOne({ _id: new mongoose.Types.ObjectId(conversationId), userId: new mongoose.Types.ObjectId(userId) });
    if (!conv) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    return conv;
  }

  /** Answers the latest user message of a conversation and stores the answer. */
  private async generateReply(conv: IConversation, userId: string): Promise<IConversationMessage> {
    const contextData = await ContextAssembler.assembleContext(userId, conv.careerId?.toString());

    // Saved so it is possible to see afterwards what data a reply was based on
    const snapshot = await ConversationContextSnapshot.create({
      conversationId: conv._id,
      userId: new mongoose.Types.ObjectId(userId),
      careerId: conv.careerId,
      contextData
    });

    // Last 10 real exchanges. Fallback notices are not model output, so they are not fed back as history.
    const recentMessages = await ConversationMessage.find({
      conversationId: conv._id,
      role: { $ne: 'system' },
      isFallback: { $ne: true }
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .lean();
    recentMessages.reverse();

    const built = buildChatPrompt(contextData, recentMessages);
    const contextTrimmed = built.droppedMessages > 0
      ? { droppedMessages: built.droppedMessages, keptMessages: built.keptMessages }
      : undefined;
    if (contextTrimmed) {
      logger.info(`Chat prompt: left out the ${built.droppedMessages} oldest history message(s) to fit the model's context.`);
    }

    try {
      const reply = await AIClientService.generateChat(built.prompt);
      return await ConversationMessage.create({
        conversationId: conv._id,
        role: 'assistant',
        content: reply.text,
        contextSnapshotId: snapshot._id,
        isFallback: false,
        source: 'ai',
        aiProvider: reply.provider,
        aiModel: reply.model,
        contextTrimmed
      });
    } catch (error) {
      const reason = error instanceof AiUnavailableError && error.reason !== 'rejected' ? error.reason : 'error';
      logger.warn(`Chat reply fell back to the stored-data summary (${reason}).`);
      return await ConversationMessage.create({
        conversationId: conv._id,
        role: 'assistant',
        content: buildFallbackReply(contextData, reason),
        contextSnapshotId: snapshot._id,
        isFallback: true,
        source: 'fallback',
        fallbackReason: reason,
        contextTrimmed
      });
    }
  }
}

/**
 * The reply shown when no AI answer could be obtained. It says so plainly and lists only
 * figures already stored for the user; it does not attempt to answer the question.
 */
export function buildFallbackReply(context: Record<string, unknown>, reason: 'unavailable' | 'timeout' | 'error' | 'busy'): string {
  const lines: string[] = [];
  lines.push(
    reason === 'timeout'
      ? 'The AI assistant did not respond in time, so this is not an AI-generated answer.'
      : reason === 'busy'
        ? 'The AI assistant is busy with other requests right now, so this is not an AI-generated answer. Try again in a minute.'
        : 'The AI assistant is unavailable right now, so this is not an AI-generated answer.'
  );

  const facts: string[] = [];
  const domain = context.userDomain as { targetRole?: string } | undefined;
  if (domain?.targetRole) facts.push(`Target role: ${domain.targetRole}`);

  const skills = (context.skills as Array<{ name?: unknown; evidenceScore?: number }> | undefined) || [];
  const named = skills.filter(s => typeof s.name === 'string');
  if (named.length > 0) {
    const strongest = [...named].sort((a, b) => (b.evidenceScore || 0) - (a.evidenceScore || 0)).slice(0, 3).map(s => s.name);
    facts.push(`Skills on your profile: ${named.length} (strongest evidence: ${strongest.join(', ')})`);
  }

  const readiness = context.readiness as { overallScore?: number } | undefined;
  if (typeof readiness?.overallScore === 'number') facts.push(`Readiness for this career: ${readiness.overallScore}/100`);

  const gaps = context.gaps as { criticalGaps?: string[] } | undefined;
  if (gaps?.criticalGaps?.length) facts.push(`Largest gaps: ${gaps.criticalGaps.slice(0, 4).join(', ')}`);

  const recs = context.topRecommendations as Array<{ title?: string }> | undefined;
  if (recs?.[0]?.title) facts.push(`Top recommended action: ${recs[0].title}`);

  if (typeof context.roadmapProgress === 'number') facts.push(`Roadmap progress: ${context.roadmapProgress}%`);

  if (facts.length > 0) {
    lines.push('', 'What your saved SkillBridge data shows:', ...facts.map(f => `- ${f}`));
  } else {
    lines.push('', 'There is no resume data on your profile yet. Upload a resume to see your skills, career matches and readiness.');
  }
  lines.push('', 'Your question was saved. Use "Retry" to ask the assistant again.');
  return lines.join('\n');
}

export default new ConversationService();
