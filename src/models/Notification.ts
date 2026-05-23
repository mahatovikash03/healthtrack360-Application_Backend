import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'tip' | 'alert';
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    type:    { type: String, enum: ['reminder', 'achievement', 'tip', 'alert'], default: 'tip' },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
