import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessonType: String, // 'trial' or 'standard'
  amount: Number,
  status: { type: String, default: 'pending' }, // pending -> paid
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Booking', bookingSchema);