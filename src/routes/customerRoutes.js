import express from 'express';
import { body } from 'express-validator';
import Customer from '../models/Customer.js';
import BankAccount from '../models/BankAccount.js';
import BVN from '../models/BVN.js';
import NIN from '../models/NIN.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * @swagger
 * /api/customer/onboard:
 *   post:
 *     summary: Create customer with KYC verification
 *     tags:
 *       - Customer Management
 *     description: Onboard a new customer with KYC details. Requires verified BVN or NIN before account creation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerOnboardRequest'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerOnboardResponse'
 *       400:
 *         description: Validation error or KYC not verified
 *       500:
 *         description: Server error
 */
router.post('/onboard', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('kycType').isIn(['BVN', 'NIN']).withMessage('KYC type must be BVN or NIN'),
  body('kycId').notEmpty().withMessage('KYC ID is required'),
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dob, kycType, kycId, fintechId, token } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already registered with this email'
      });
    }

    let identityValid = false;
    if (kycType === 'BVN') {
      const bvnRecord = await BVN.findOne({ bvn: kycId });
      identityValid = bvnRecord && bvnRecord.isVerified;
    } else if (kycType === 'NIN') {
      const ninRecord = await NIN.findOne({ nin: kycId });
      identityValid = ninRecord && ninRecord.isVerified;
    }

    if (!identityValid) {
      return res.status(400).json({
        success: false,
        message: `${kycType} verification required before customer onboarding`
      });
    }

    const customer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: new Date(dob),
      kycType,
      kycId,
      fintechId,
      kycStatus: 'VERIFIED',
      isVerified: true,
      verificationDate: new Date()
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customerId: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        kycStatus: customer.kycStatus
      }
    });
  } catch (error) {
    console.error('Customer onboarding error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Customer onboarding failed'
    });
  }
});

/**
 * @swagger
 * /api/customer/account/create:
 *   post:
 *     summary: Create bank account for customer
 *     tags:
 *       - Customer Management
 *     description: Create a new bank account for a verified customer. Account is auto-funded with NGN 15,000.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountRequest'
 *     responses:
 *       201:
 *         description: Bank account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAccountResponse'
 *       400:
 *         description: Validation error or customer already has account
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/account/create', [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('kycType').isIn(['bvn', 'nin']).withMessage('KYC type must be bvn or nin'),
  body('kycId').notEmpty().withMessage('KYC ID is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { customerId, fintechId, kycType, kycId, dob, token } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const existingAccount = await BankAccount.findOne({ customerId });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Customer already has a bank account'
      });
    }

    const nibssResponse = await nibssService.createAccount(kycType, kycId, dob, token);

    const bankAccount = new BankAccount({
      accountNumber: nibssResponse.accountNumber,
      accountName: `${customer.firstName} ${customer.lastName}`,
      customerId,
      fintechId,
      kycType: kycType.toUpperCase(),
      kycId,
      balance: 15000,
      bankCode: nibssResponse.bankCode,
      bankName: nibssResponse.bankName,
      status: 'ACTIVE',
      isVerified: true
    });

    await bankAccount.save();

    customer.accountId = bankAccount._id;
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Bank account created successfully with NGN 15,000 initial balance',
      data: {
        accountId: bankAccount._id,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        balance: bankAccount.balance,
        currency: bankAccount.currency,
        bankCode: bankAccount.bankCode,
        bankName: bankAccount.bankName,
        status: bankAccount.status
      }
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Account creation failed'
    });
  }
});

/**
 * @swagger
 * /api/customer/{customerId}:
 *   get:
 *     summary: Get customer details
 *     tags:
 *       - Customer Management
 *     description: Retrieve details of a specific customer by ID, including linked account information.
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the customer
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId)
      .populate('accountId')
      .populate('fintechId', 'name email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/customer/fintech/{fintechId}:
 *   get:
 *     summary: Get all customers for a fintech
 *     tags:
 *       - Customer Management
 *     description: Retrieve all customers registered with a specific fintech institution.
 *     parameters:
 *       - in: path
 *         name: fintechId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the fintech institution
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/fintech/:fintechId', async (req, res) => {
  try {
    const customers = await Customer.find({ fintechId: req.params.fintechId })
      .populate('accountId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
