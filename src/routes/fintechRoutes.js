import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Fintech from '../models/Fintech.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * /api/fintech/onboard:
 *   post:
 *     summary: Register a fintech institution with NIBSS
 *     tags:
 *       - Fintech Management
 *     description: Onboard a new fintech institution with the NIBSS Phoenix API. Returns API credentials for authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FintechOnboardRequest'
 *     responses:
 *       201:
 *         description: Fintech registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FintechOnboardResponse'
 *       400:
 *         description: Validation error or fintech already registered
 *       500:
 *         description: Server error
 */
router.post('/onboard', [
  body('name').notEmpty().withMessage('Fintech name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], validateRequest, async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingFintech = await Fintech.findOne({ email });
    if (existingFintech) {
      return res.status(400).json({
        success: false,
        message: 'Fintech already registered with this email'
      });
    }

    const nibssResponse = await nibssService.onboardFintech(name, email);

    const fintech = new Fintech({
      name,
      email,
      apiKey: nibssResponse.apiKey,
      apiSecret: nibssResponse.apiSecret,
      bankCode: nibssResponse.bankCode,
      bankName: nibssResponse.bankName,
      isActive: true
    });

    await fintech.save();

    res.status(201).json({
      success: true,
      message: 'Fintech registered successfully',
      data: {
        fintechId: fintech._id,
        name: fintech.name,
        email: fintech.email,
        apiKey: fintech.apiKey,
        apiSecret: fintech.apiSecret,
        bankCode: fintech.bankCode,
        bankName: fintech.bankName
      }
    });
  } catch (error) {
    console.error('Fintech onboarding error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Fintech onboarding failed'
    });
  }
});

/**
 * @swagger
 * /api/fintech/login:
 *   post:
 *     summary: Authenticate fintech and get JWT token
 *     tags:
 *       - Fintech Management
 *     description: Login with fintech API credentials to obtain a JWT token for subsequent API requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FintechLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FintechLoginResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', [
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required')
], validateRequest, async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    const fintech = await Fintech.findOne({ apiKey, apiSecret });
    if (!fintech) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials'
      });
    }

    const loginResponse = await nibssService.login(apiKey, apiSecret);

    fintech.jwtToken = loginResponse.token;
    fintech.tokenExpiresAt = new Date(Date.now() + 3600000);
    fintech.lastLoginAt = new Date();
    await fintech.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        fintechId: fintech._id,
        token: loginResponse.token,
        expiresIn: 3600,
        fintech: {
          name: fintech.name,
          email: fintech.email,
          bankCode: fintech.bankCode,
          bankName: fintech.bankName
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

/**
 * @swagger
 * /api/fintech/{fintechId}:
 *   get:
 *     summary: Get fintech institution details
 *     tags:
 *       - Fintech Management
 *     description: Retrieve details of a registered fintech institution by ID.
 *     parameters:
 *       - in: path
 *         name: fintechId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the fintech institution
 *     responses:
 *       200:
 *         description: Fintech details retrieved successfully
 *       404:
 *         description: Fintech not found
 *       500:
 *         description: Server error
 */
router.get('/:fintechId', async (req, res) => {
  try {
    const fintech = await Fintech.findById(req.params.fintechId).select('-apiSecret');
    if (!fintech) {
      return res.status(404).json({
        success: false,
        message: 'Fintech not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fintech
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
