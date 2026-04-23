import express from 'express';
import { body, param } from 'express-validator';
import BankAccount from '../models/BankAccount.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/account/:accountNumber/balance
 * Get account balance
 */
router.get('/:accountNumber/balance', [
  param('accountNumber').notEmpty().withMessage('Account number is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { token } = req.body;

    // Get account from local database
    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Call NIBSS API for real-time balance
    const nibssResponse = await nibssService.getBalance(accountNumber, token);

    res.status(200).json({
      success: true,
      message: 'Balance retrieved successfully',
      data: {
        accountNumber: nibssResponse.accountNumber || accountNumber,
        balance: nibssResponse.balance || account.balance,
        currency: account.currency,
        accountName: account.accountName
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve balance'
    });
  }
});

/**
 * GET /api/account/:accountNumber/name-enquiry
 * Perform name enquiry on account
 */
router.get('/:accountNumber/name-enquiry', [
  param('accountNumber').notEmpty().withMessage('Account number is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { token } = req.body;

    // Get account from local database
    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Call NIBSS API for name enquiry
    const nibssResponse = await nibssService.nameEnquiry(accountNumber, token);

    res.status(200).json({
      success: true,
      message: 'Name enquiry successful',
      data: {
        accountNumber: nibssResponse.accountNumber || accountNumber,
        accountName: nibssResponse.accountName || account.accountName,
        bankName: nibssResponse.bankName || account.bankName,
        bankCode: account.bankCode
      }
    });
  } catch (error) {
    console.error('Name enquiry error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Name enquiry failed'
    });
  }
});

/**
 * GET /api/accounts
 * Get all accounts for a fintech
 */
router.get('/', [
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { fintechId, token } = req.body;

    // Get accounts from local database
    const accounts = await BankAccount.find({ fintechId })
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Call NIBSS API for all accounts
    let nibssAccounts = [];
    try {
      const nibssResponse = await nibssService.getAllAccounts(token);
      nibssAccounts = nibssResponse.accounts || [];
    } catch (error) {
      console.warn('Failed to fetch accounts from NIBSS:', error.message);
    }

    res.status(200).json({
      success: true,
      count: accounts.length,
      message: 'Accounts retrieved successfully',
      data: {
        localAccounts: accounts,
        nibssAccounts: nibssAccounts
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve accounts'
    });
  }
});

/**
 * GET /api/account/:accountId
 * Get account details by ID
 */
router.get('/details/:accountId', async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.accountId)
      .populate('customerId', 'firstName lastName email phone')
      .populate('fintechId', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
