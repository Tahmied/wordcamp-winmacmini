import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
  },
  phone: {
    type: String,
    required: [true, 'Please enter your phone number'],
    unique: true,
  },
  profession: {
    type: String,
  },
  company: {
    type: String,
  },
  userToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rewarded'],
    default: 'pending',
  },
  quizState: {
    score: Number,
    attemptCount: { type: Number, default: 0 },
    servedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    retakeUsed: { type: Boolean, default: false },
    retaking: { type: Boolean, default: false }
  },
  ipAddress: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  assignedPrize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize'
  }, 
  rewardTaken: {
    type: Boolean,
    default: false
  }
});

export const User = mongoose.model('User', userSchema);
