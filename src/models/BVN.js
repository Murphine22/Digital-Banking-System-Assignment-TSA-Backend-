import mongoose from 'mongoose';

const bvnSchema = new mongoose.Schema({
  bvn: {
    type: String,
    required: true,
    unique: true,
    length: 11,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['M', 'F'],
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'FAILED', 'REJECTED'],
    default: 'PENDING'
  },
  verificationDate: Date,
  fintechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fintech'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('BVN', bvnSchema);
