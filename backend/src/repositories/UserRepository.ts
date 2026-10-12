import { User, IUser } from '../models/User.js';

export class UserRepository {
  /**
   * Finds a user by email, explicitly including the hashed password for verification.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const normalized = (email || '').toLowerCase().trim();
    return User.findOne({ email: normalized }).select('+passwordHash');
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
    if (userData.email) {
      userData.email = userData.email.toLowerCase().trim();
    }
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
