import { User, IUser } from '../models/User.js';

export class UserRepository {
  /**
   * Finds a user by email, explicitly including the hashed password for verification.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+passwordHash');
  }

  /**
   * Finds a user by their MongoDB ID.
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Creates a new user document in the database.
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  /**
   * Updates an existing user document.
   */
  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }
}

export default UserRepository;
