import express from 'express';
import { body, param } from 'express-validator';
import BankAccount from '../models/BankAccount.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/account/{accountNumber}/balance:
 *   get:
 *     summary: Get account balance
 *     tags:
 *       - Account Operations
 *     description: Retrieve real-time account balance from NIBSS API.
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account number
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
 *         description: Balance retrieved successfully
 *       404:
 *         description: Account not found
 *       400:
 *         description: Balance retrieval failed
 */
router.get('/:accountNumber/balance', [
  param('accountNumber').notEmpty().withMessage('Account number is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { token } = req.body;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

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
 * @swagger
 * /api/account/{accountNumber}/name-enquiry:
 *   get:
 *     summary: Perform name enquiry on account
 *     tags:
 *       - Account Operations
 *     description: Resolve an account number to the account holder's name through NIBSS API.
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account number to enquire
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
 *         description: Name enquiry successful
 *       404:
 *         description: Account not found
 *       400:
 *         description: Name enquiry failed
 */
router.get('/:accountNumber/name-enquiry', [
  param('accountNumber').notEmpty().withMessage('Account number is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { token } = req.body;

    const account = await BankAccount.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

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
 * @swagger
 * /api/account:
 *   get:
 *     summary: Get all accounts for a fintech
 *     tags:
 *       - Account Operations
 *     description: Retrieve all bank accounts registered with a fintech institution.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fintechId, token]
 *             properties:
 *               fintechId:
 *                 type: string
 *                 description: MongoDB ObjectId of fintech
 *               token:
 *                 type: string
 *                 description: NIBSS JWT token
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', [
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { fintechId, token } = req.body;

    const accounts = await BankAccount.find({ fintechId })
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

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
 * @swagger
 * /api/account/details/{accountId}:
 *   get:
 *     summary: Get account details by ID
 *     tags:
 *       - Account Operations
 *     description: Retrieve detailed information about a specific bank account.
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the account
 *     responses:
 *       200:
 *         description: Account details retrieved successfully
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
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
