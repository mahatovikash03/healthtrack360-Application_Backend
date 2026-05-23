import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age?: number;
  city?: string;
  state?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name:      { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
    email:     { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:  { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role:      { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarUrl: { type: String },
    gender:    { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    age:       { type: Number, min: 1, max: 120 },
    city:      { type: String, trim: true, maxlength: 100 },
    state:     { type: String, trim: true, maxlength: 100 },
    country:   { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
