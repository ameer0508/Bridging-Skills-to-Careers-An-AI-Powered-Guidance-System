import mongoose, { Schema, Document } from 'mongoose';

export interface IRoadmapHistory extends Document {
  userId: string;
  roadmapId?: string;
  action: string;
  timestamp: Date;
}

const RoadmapHistorySchema = new Schema<IRoadmapHistory>(
  {
    userId: { type: String, required: true, index: true },
    roadmapId: { type: String },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const RoadmapHistory = mongoose.models.RoadmapHistory || mongoose.model<IRoadmapHistory>('RoadmapHistory', RoadmapHistorySchema);
export default RoadmapHistory;
