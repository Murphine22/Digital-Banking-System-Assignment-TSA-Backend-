import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Fintech from '../models/Fintech.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * POST /api/fintech/onboard
 * Register a fintech institution with NIBSS
 */
router.post('/onboard', [
  body('name').notEmpty().withMessage('Fintech name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], validateRequest, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if fintech already exists
    const existingFintech = await Fintech.findOne({ email });
    if (existingFintech) {
      return res.status(400).json({
        success: false,
        message: 'Fintech already registered with this email'
      });
    }

    // Call NIBSS onboarding API
    const nibssResponse = await nibssService.onboardFintech(name, email);

    // Store fintech credentials in database
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
 * POST /api/fintech/login
 * Authenticate fintech and get JWT token
 */
router.post('/login', [
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required')
], validateRequest, async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    // Find fintech by API credentials
    const fintech = await Fintech.findOne({ apiKey, apiSecret });
    if (!fintech) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API credentials'
      });
    }

    // Call NIBSS login API
    const loginResponse = await nibssService.login(apiKey, apiSecret);

    // Update fintech token
    fintech.jwtToken = loginResponse.token;
    fintech.tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour
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
 * GET /api/fintech/:fintechId
 * Get fintech details
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
