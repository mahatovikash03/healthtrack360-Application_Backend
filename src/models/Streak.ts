import mongoose, { Document, Schema } from 'mongoose';

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  active: boolean;
  startDate: Date;
  endDate?: Date;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  bestDays: number;
  breakReason?: string;
  checkIns: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, default: 'Healthy Eating Streak' },
    active:      { type: Boolean, default: false },
    startDate:   { type: Date },
    endDate:     { type: Date },
    days:        { type: Number, default: 0 },
    hours:       { type: Number, default: 0 },
    minutes:     { type: Number, default: 0 },
    seconds:     { type: Number, default: 0 },
    bestDays:    { type: Number, default: 0 },
    breakReason: { type: String, maxlength: 500 },
    checkIns:    [{ type: Date }],
  },
  { timestamps: true }
);

StreakSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IStreak>('Streak', StreakSchema);
