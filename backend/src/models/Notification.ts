import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationKind = 'milestone' | 'reminder';

/**
 * An in-app notification. Nothing is sent by e-mail, SMS or push. One is created only while the
 * user has switched that kind on, and never twice for the same occasion.
 */
export interface INotification extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  kind: NotificationKind;
  /** Identifies the occasion, e.g. "skillcheck:Docker"; unique per user. */
  key: string;
  title: string;
  body: string;
  /** In-app path to open. */
  link: string;
  readAt?: Date | null;
  /** Set when the user dismisses it. The record is kept so the same occasion is not announced again. */
  dismissedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['milestone', 'reminder'], required: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    readAt: { type: Date, default: null },
    dismissedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
