/**
 * Accounts deleted while this process runs. An access token stays valid for its short lifetime,
 * so `authenticate` refuses tokens of a deleted account instead of letting them create new data.
 * In-process only: with several backend instances each would need to learn of the deletion.
 */
const revoked = new Set<string>();

export const revokeAccount = (userId: string): void => {
  revoked.add(userId);
};

export const isRevokedAccount = (userId: string): boolean => revoked.has(userId);
