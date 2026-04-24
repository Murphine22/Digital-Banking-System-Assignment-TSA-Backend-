import express from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/transaction/transfer:
 *   post:
 *     summary: Initiate fund transfer
 *     tags:
 *       - Transactions
 *     description: Initiate intra-bank or inter-bank fund transfer with mandatory name enquiry and identity validation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       201:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Validation error or transfer failed
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post('/transfer', [
  body('fromAccountNumber').notEmpty().withMessage('From account number is required'),
  body('toAccountNumber').notEmpty().withMessage('To account number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required'),
  body('description').optional().isString()
], validateRequest, async (req, res) => {
  try {
    const { fromAccountNumber, toAccountNumber, amount, fintechId, token, description } = req.body;

    // Get from account
    const fromAccount = await BankAccount.findOne({ accountNumber: fromAccountNumber });
    if (!fromAccount) {
      return res.status(404).json({
        success: false,
        message: 'From account not found'
      });
    }

    // Check balance
    if (fromAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Perform name enquiry on recipient
    let recipientDetails = {};
    try {
      recipientDetails = await nibssService.nameEnquiry(toAccountNumber, token);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Recipient account not found or invalid'
      });
    }

    // Determine transfer type
    const toAccount = await BankAccount.findOne({ accountNumber: toAccountNumber });
    const transactionType = toAccount && toAccount.fintechId.toString() === fintechId ? 'INTRA_BANK' : 'INTER_BANK';

    // Call NIBSS API to initiate transfer
    const transactionId = uuidv4();
    let nibssResponse;
    try {
      nibssResponse = await nibssService.transfer(fromAccountNumber, toAccountNumber, amount.toString(), token);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Transfer failed'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: nibssResponse.transactionId || transactionId,
      fintechId,
      fromAccountId: fromAccount._id,
      toAccountId: toAccount?._id,
      fromAccountNumber,
      toAccountNumber,
      recipientName: recipientDetails.accountName,
      recipientBankCode: recipientDetails.bankCode,
      recipientBankName: recipientDetails.bankName,
      amount,
      transactionType,
      description,
      status: nibssResponse.status || 'PENDING',
      reference: nibssResponse.reference,
      narration: description,
      responseCode: nibssResponse.responseCode,
      responseMessage: nibssResponse.responseMessage
    });

    await transaction.save();

    // Deduct amount from sender's account (for local tracking)
    fromAccount.balance -= amount;
    await fromAccount.save();

    // Add amount to recipient's account if intra-bank
    if (toAccount) {
      toAccount.balance += amount;
      await toAccount.save();
    }

    res.status(201).json({
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        fromAccountNumber: transaction.fromAccountNumber,
        toAccountNumber: transaction.toAccountNumber,
        recipientName: transaction.recipientName,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        status: transaction.status,
        initiatedAt: transaction.initiatedAt
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Transfer failed'
    });
  }
});

/**
 * @swagger
 * /api/transaction/{transactionId}:
 *   get:
 *     summary: Get transaction status (TSQ)
 *     tags:
 *       - Transactions
 *     description: Query the status of a specific transaction by its ID through NIBSS Transaction Status Query (TSQ).
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID to query
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: NIBSS JWT token
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *       404:
 *         description: Transaction not found
 *       400:
 *         description: TSQ failed
 */
router.get('/:transactionId', [
  param('transactionId').notEmpty().withMessage('Transaction ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { token } = req.body;

    // Get transaction from local database
    const transaction = await Transaction.findOne({ transactionId })
      .populate('fromAccountId', 'accountNumber accountName')
      .populate('toAccountId', 'accountNumber accountName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Call NIBSS API for latest status
    let nibssStatus;
    try {
      nibssStatus = await nibssService.getTransactionStatus(transactionId, token);
    } catch (error) {
      console.warn('Failed to fetch status from NIBSS:', error.message);
    }

    // Update transaction status if different
    if (nibssStatus && nibssStatus.status !== transaction.status) {
      transaction.status = nibssStatus.status;
      transaction.responseCode = nibssStatus.responseCode;
      transaction.responseMessage = nibssStatus.responseMessage;
      if (nibssStatus.status === 'SUCCESS') {
        transaction.completedAt = new Date();
      }
      await transaction.save();
    }

    res.status(200).json({
      success: true,
      message: 'Transaction status retrieved',
      data: {
        transactionId: transaction.transactionId,
        fromAccount: transaction.fromAccountId,
        toAccount: transaction.toAccountId,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        status: transaction.status,
        statusReason: transaction.statusReason,
        reference: transaction.reference,
        initiatedAt: transaction.initiatedAt,
        completedAt: transaction.completedAt,
        responseCode: transaction.responseCode,
        responseMessage: transaction.responseMessage
      }
    });
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transaction status'
    });
  }
});

/**
 * @swagger
 * /api/transaction/account/{accountId}:
 *   get:
 *     summary: Get transaction history for account
 *     tags:
 *       - Transactions
 *     description: Retrieve transaction history for a specific account with strict data privacy controls. Only transactions involving this account are returned.
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the account
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Get account to verify it exists
    const account = await BankAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Get transactions for this account only (privacy control)
    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    })
      .populate('fromAccountId', 'accountNumber accountName')
      .populate('toAccountId', 'accountNumber accountName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Get total count
    const total = await Transaction.countDocuments({
      $or: [
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
      message: 'Transaction history retrieved',
      data: transactions
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transaction history'
    });
  }
});

/**
 * @swagger
 * /api/transaction/fintech/{fintechId}:
 *   get:
 *     summary: Get all transactions for fintech
 *     tags:
 *       - Transactions
 *     description: Retrieve all transactions for a fintech institution with pagination and optional status filtering.
 *     parameters:
 *       - in: path
 *         name: fintechId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the fintech
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/fintech/:fintechId', async (req, res) => {
  try {
    const { fintechId } = req.params;
    const { limit = 100, skip = 0, status } = req.query;

    let query = { fintechId };
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('fromAccountId', 'accountNumber accountName')
      .populate('toAccountId', 'accountNumber accountName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
      message: 'Transactions retrieved',
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transactions'
    });
  }
});

export default router;
