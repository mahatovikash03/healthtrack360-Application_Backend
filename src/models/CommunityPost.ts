import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityPost extends Document {
  author: mongoose.Types.ObjectId;
  authorName: string;
  title: string;
  content: string;
  tag: string;
  likes: mongoose.Types.ObjectId[];
  comments: { user: mongoose.Types.ObjectId; text: string; createdAt: Date }[];
  createdAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    author:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    title:      { type: String, required: true, maxlength: 150 },
    content:    { type: String, required: true, maxlength: 2000 },
    tag:        { type: String, default: 'General' },
    likes:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      user:      { type: Schema.Types.ObjectId, ref: 'User' },
      text:      { type: String, maxlength: 500 },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ tag: 1 });

export default mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
