import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRoadmapHistory extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  roadmapId: Types.ObjectId;
  action: string;
  itemId?: Types.ObjectId;
  details: string;
  createdAt: Date;
}

const RoadmapHistorySchema = new Schema<IRoadmapHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'LearningRoadmap', required: true, index: true },
    action: { type: String, required: true },
    itemId: { type: Schema.Types.ObjectId },
    details: { type: String, default: '' }
  },
  { timestamps: true }
);

export const RoadmapHistory: Model<IRoadmapHistory> =
  (mongoose.models.RoadmapHistory as Model<IRoadmapHistory>) ||
  mongoose.model<IRoadmapHistory>('RoadmapHistory', RoadmapHistorySchema);
export default RoadmapHistory;
