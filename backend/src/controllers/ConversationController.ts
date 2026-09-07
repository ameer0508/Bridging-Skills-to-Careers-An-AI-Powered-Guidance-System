import { Request, Response, NextFunction } from 'express';
import ConversationService from '../services/ConversationService.js';
import { ConversationFeedback } from '../models/ConversationFeedback.js';
import { AppError } from '../middlewares/errorHandler.js';
import mongoose from 'mongoose';

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
      const { careerId, title } = req.body;
      if (!userId) throw new AppError('Authentication required', 401);

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
      const { content } = req.body;
      if (!userId) throw new AppError('Authentication required', 401);
      if (!content) throw new AppError('Message content required', 400);

      const aiMessage = await ConversationService.sendMessage(id, userId, content);
      res.status(200).json({ success: true, data: aiMessage });
    } catch (error) { next(error); }
  };

  switchCareer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { careerId } = req.body;
      if (!userId) throw new AppError('Authentication required', 401);
      if (!careerId) throw new AppError('careerId required', 400);

      const conv = await ConversationService.switchCareer(id, userId, careerId);
      res.status(200).json({ success: true, data: conv });
    } catch (error) { next(error); }
  };

  submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
       const userId = req.user?.userId;
       const { id: messageId } = req.params;
       const { isHelpful, feedbackText } = req.body;
       if (!userId) throw new AppError('Authentication required', 401);

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
