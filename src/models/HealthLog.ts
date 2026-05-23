import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  sleep: {
    duration: number;
    quality: number;
    bedtime: string;
    wakeTime: string;
    consistencyScore?: number;
  };
  diet: {
    meals: { type: string; nutritionRating: number; calories: number }[];
    hydration: number;
  };
  fitness: {
    type: string;
    duration: number;
    intensity: 'low' | 'moderate' | 'high';
  }[];
  skincare: {
    productsUsed: string[];
    skinIssues: string[];
  };
  mentalWellness: {
    moodRating: number;
    stressLevel: 'low' | 'moderate' | 'high';
    notes?: string;
  };
  wellnessScore?: number;
}

const HealthLogSchema = new Schema<IHealthLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date:   { type: Date, default: Date.now, index: true },

    sleep: {
      duration:         { type: Number, min: 0, max: 24 },
      quality:          { type: Number, min: 1, max: 5 },
      bedtime:          { type: String },
      wakeTime:         { type: String },
      consistencyScore: { type: Number },
    },

    diet: {
      meals: [{
        type:            { type: String },
        nutritionRating: { type: Number, min: 1, max: 5 },
        calories:        { type: Number },
      }],
      hydration: { type: Number, min: 0 },
    },

    fitness: [{
      type:      { type: String },
      duration:  { type: Number, min: 0 },
      intensity: { type: String, enum: ['low', 'moderate', 'high'] },
    }],

    skincare: {
      productsUsed: [{ type: String }],
      skinIssues:   [{ type: String }],
    },

    mentalWellness: {
      moodRating:  { type: Number, min: 1, max: 5 },
      stressLevel: { type: String, enum: ['low', 'moderate', 'high'] },
      notes:       { type: String, maxlength: 1000 },
    },

    wellnessScore: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound index for fast user + date queries
HealthLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IHealthLog>('HealthLog', HealthLogSchema);
