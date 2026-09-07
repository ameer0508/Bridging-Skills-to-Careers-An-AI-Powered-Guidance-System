import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Registers a user and returns their initial session tokens.
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fullName, email, password } = req.body;
      const result = await this.authService.register(fullName, email, password);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticates a user's credentials and returns their tokens.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logs out the user by revoking their refresh token session.
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      res.clearCookie('sb-refresh-token');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validates and rotates the user session's refresh token.
   */
  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.['sb-refresh-token'];
      const result = await this.authService.refresh(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
