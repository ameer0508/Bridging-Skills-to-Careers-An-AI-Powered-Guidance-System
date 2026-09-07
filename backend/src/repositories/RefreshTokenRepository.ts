import { RefreshToken, IRefreshToken } from '../models/RefreshToken.js';

export class RefreshTokenRepository {
  /**
   * Locates a refresh token in the database.
   */
  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token });
  }

  /**
   * Inserts a new refresh token record.
   */
  async create(tokenData: Partial<IRefreshToken>): Promise<IRefreshToken> {
    const token = new RefreshToken(tokenData);
    return token.save();
  }

  /**
   * Revokes a specific refresh token, optionally linking it to its rotated replacement.
   */
  async revoke(token: string, replacedByToken?: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOneAndUpdate(
      { token },
      { $set: { isRevoked: true, replacedByToken } },
      { new: true }
    );
  }

  /**
   * Revokes all refresh tokens issued to a user. Used to terminate all sessions.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
  }
}

export default RefreshTokenRepository;
