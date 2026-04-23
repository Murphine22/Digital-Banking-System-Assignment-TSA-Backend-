import mongoose from 'mongoose';

const fintechSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  apiKey: {
    type: String,
    required: true,
    trim: true
  },
  apiSecret: {
    type: String,
    required: true,
    trim: true
  },
  bankCode: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  jwtToken: {
    type: String,
    trim: true
  },
  tokenExpiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Fintech', fintechSchema);
