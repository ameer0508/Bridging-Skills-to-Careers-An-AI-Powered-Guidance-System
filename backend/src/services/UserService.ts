import UserRepository from '../repositories/UserRepository.js';
import { IUser } from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Retrieves a user profile. Throws a 404 if the user is missing.
   */
  async getUserProfile(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found.') as AppError;
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    return user;
  }

  /**
   * Updates user profile parameters.
   */
  async updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    const user = await this.userRepository.update(userId, updateData);
    if (!user) {
      const error = new Error('User not found.') as AppError;
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    return user;
  }
}

export default UserService;
