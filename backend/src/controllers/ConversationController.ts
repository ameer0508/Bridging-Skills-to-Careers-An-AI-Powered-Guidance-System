import { Request, Response, NextFunction } from 'express';
import ConversationService from '../services/ConversationService.js';
import { ConversationFeedback } from '../models/ConversationFeedback.js';
import { AppError } from '../middlewares/errorHandler.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { ConversationMessage } from '../models/ConversationMessage.js';

const objectId = z.string().refine(value => mongoose.Types.ObjectId.isValid(value), { message: 'is not a valid id' });

const createConversationSchema = z.object({
  careerId: objectId.optional(),
  title: z.string().trim().min(1).max(120).optional(),
}).strict();

const switchCareerSchema = z.object({ careerId: objectId }).strict();

const feedbackSchema = z.object({
  isHelpful: z.boolean(),
  feedbackText: z.string().max(1000).optional(),
}).strict();

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    const detail = parsed.error.issues.map(i => `${i.path.join('.') || 'request'} ${i.message}`).join('; ');
    throw new AppError(`Invalid request: ${detail}`, 400, 'VALIDATION_ERROR');
  }
  return parsed.data;
}

class ConversationController {
  
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);
      
      const convs = await ConversationService.getConversations(userId);
      res.status(200).json({ success: true, data: convs });
    } catch (error) { next(error); }
  };

  createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);
      const { careerId, title } = parseBody(createConversationSchema, req.body);

      const conv = await ConversationService.createConversation(userId, careerId, title);
      res.status(201).json({ success: true, data: conv });
    } catch (error) { next(error); }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) throw new AppError('Authentication required', 401);

      const history = await ConversationService.getConversationHistory(id, userId);
      res.status(200).json({ success: true, data: history });
    } catch (error) { next(error); }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!userId) throw new AppError('Authentication required', 401);
      if (!content) throw new AppError('Message content required', 400, 'VALIDATION_ERROR');
      if (content.length > 4000) throw new AppError('Message is too long (4000 characters at most).', 400, 'VALIDATION_ERROR');

      const aiMessage = await ConversationService.sendMessage(id, userId, content);
      res.status(200).json({ success: true, data: aiMessage });
    } catch (error) { next(error); }
  };

  /** Asks again for the last question when its answer was a fallback. */
  retryMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) throw new AppError('Authentication required', 401);

      const aiMessage = await ConversationService.retryLastReply(id, userId);
      res.status(200).json({ success: true, data: aiMessage });
    } catch (error) { next(error); }
  };

  switchCareer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) throw new AppError('Authentication required', 401);
      const { careerId } = parseBody(switchCareerSchema, req.body);

      const conv = await ConversationService.switchCareer(id, userId, careerId);
      res.status(200).json({ success: true, data: conv });
    } catch (error) { next(error); }
  };

  submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
       const userId = req.user?.userId;
       const { id: messageId } = req.params;
       if (!userId) throw new AppError('Authentication required', 401);
       if (!mongoose.Types.ObjectId.isValid(messageId)) {
         throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
       }
       const { isHelpful, feedbackText } = parseBody(feedbackSchema, req.body);

       // Feedback can only be left on a message in one of the caller's own conversations
       const message = await ConversationMessage.findById(messageId).select('conversationId');
       const owned = message
         ? await Conversation.exists({ _id: message.conversationId, userId: new mongoose.Types.ObjectId(userId) })
         : null;
       if (!owned) throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');

       const feedback = await ConversationFeedback.create({
         messageId: new mongoose.Types.ObjectId(messageId),
         userId: new mongoose.Types.ObjectId(userId),
         isHelpful,
         feedbackText
       });

       res.status(201).json({ success: true, data: feedback });
    } catch(error) { next(error); }
  };
}

export default new ConversationController();
