import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fintechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fintech',
    required: true
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount'
  },
  fromAccountNumber: {
    type: String,
    required: true,
    trim: true
  },
  toAccountNumber: {
    type: String,
    required: true,
    trim: true
  },
  recipientName: {
    type: String,
    trim: true
  },
  recipientBankCode: {
    type: String,
    trim: true
  },
  recipientBankName: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  transactionType: {
    type: String,
    enum: ['INTRA_BANK', 'INTER_BANK', 'WITHDRAWAL', 'DEPOSIT'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  statusReason: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  narration: {
    type: String,
    trim: true
  },
  responseCode: {
    type: String,
    trim: true
  },
  responseMessage: {
    type: String,
    trim: true
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
transactionSchema.index({ fromAccountId: 1, createdAt: -1 });
transactionSchema.index({ toAccountId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model('Transaction', transactionSchema);
