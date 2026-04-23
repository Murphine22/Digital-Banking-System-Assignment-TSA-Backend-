import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['SAVINGS', 'CURRENT', 'CHECKING'],
    default: 'SAVINGS'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  fintechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fintech',
    required: true
  },
  kycType: {
    type: String,
    enum: ['BVN', 'NIN'],
    required: true
  },
  kycId: {
    type: String,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    default: 15000, // NGN 15,000 initial balance
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  bankCode: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED'],
    default: 'ACTIVE'
  },
  isVerified: {
    type: Boolean,
    default: false
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

export default mongoose.model('BankAccount', bankAccountSchema);
