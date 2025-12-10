import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: String,
  tagline: String, // e.g. "Professional Teacher"
  bio: String,
  avatar: String, // URL to image
  rating: { type: Number, default: 5.0 },
  lessonCount: { type: Number, default: 0 },
  prices: {
    trial: Number,    // e.g. 8
    standard: Number, // e.g. 20
  }
});

export default mongoose.model('Teacher', teacherSchema);