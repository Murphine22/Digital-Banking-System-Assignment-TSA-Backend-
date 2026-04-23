import express from 'express';
import { body } from 'express-validator';
import BVN from '../models/BVN.js';
import NIN from '../models/NIN.js';
import Fintech from '../models/Fintech.js';
import nibssService from '../services/nibssService.js';
import { validateRequest } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/identity/insertBvn
 * Insert BVN record
 */
router.post('/insertBvn', [
  body('bvn').isLength({ min: 11, max: 11 }).withMessage('BVN must be 11 digits'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { bvn, firstName, lastName, dob, phone, fintechId, token } = req.body;

    // Check if BVN already exists
    const existingBvn = await BVN.findOne({ bvn });
    if (existingBvn) {
      return res.status(400).json({
        success: false,
        message: 'BVN already registered'
      });
    }

    // Call NIBSS API to insert BVN
    const nibssResponse = await nibssService.insertBvn(bvn, firstName, lastName, dob, phone, token);

    // Store BVN record locally
    const bvnRecord = new BVN({
      bvn,
      firstName,
      lastName,
      dateOfBirth: new Date(dob),
      phone,
      fintechId,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      verificationDate: new Date()
    });

    await bvnRecord.save();

    res.status(201).json({
      success: true,
      message: 'BVN record created successfully',
      data: {
        bvnId: bvnRecord._id,
        bvn: bvnRecord.bvn,
        firstName: bvnRecord.firstName,
        lastName: bvnRecord.lastName,
        verificationStatus: bvnRecord.verificationStatus
      }
    });
  } catch (error) {
    console.error('Insert BVN error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'BVN insertion failed'
    });
  }
});

/**
 * POST /api/identity/insertNin
 * Insert NIN record
 */
router.post('/insertNin', [
  body('nin').isLength({ min: 11, max: 11 }).withMessage('NIN must be 11 digits'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('fintechId').notEmpty().withMessage('Fintech ID is required'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { nin, firstName, lastName, dob, fintechId, token } = req.body;

    // Check if NIN already exists
    const existingNin = await NIN.findOne({ nin });
    if (existingNin) {
      return res.status(400).json({
        success: false,
        message: 'NIN already registered'
      });
    }

    // Call NIBSS API to insert NIN
    const nibssResponse = await nibssService.insertNin(nin, firstName, lastName, dob, token);

    // Store NIN record locally
    const ninRecord = new NIN({
      nin,
      firstName,
      lastName,
      dateOfBirth: new Date(dob),
      fintechId,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      verificationDate: new Date()
    });

    await ninRecord.save();

    res.status(201).json({
      success: true,
      message: 'NIN record created successfully',
      data: {
        ninId: ninRecord._id,
        nin: ninRecord.nin,
        firstName: ninRecord.firstName,
        lastName: ninRecord.lastName,
        verificationStatus: ninRecord.verificationStatus
      }
    });
  } catch (error) {
    console.error('Insert NIN error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'NIN insertion failed'
    });
  }
});

/**
 * POST /api/identity/validateBvn
 * Validate BVN
 */
router.post('/validateBvn', [
  body('bvn').isLength({ min: 11, max: 11 }).withMessage('BVN must be 11 digits'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { bvn, token } = req.body;

    // Call NIBSS API to validate BVN
    const nibssResponse = await nibssService.validateBvn(bvn, token);

    // Check local database
    const bvnRecord = await BVN.findOne({ bvn });

    res.status(200).json({
      success: true,
      message: 'BVN validation successful',
      data: {
        valid: nibssResponse.valid || true,
        bvn: nibssResponse.bvn || bvn,
        firstName: nibssResponse.firstName,
        lastName: nibssResponse.lastName,
        dateOfBirth: nibssResponse.dob,
        isRegisteredLocally: !!bvnRecord
      }
    });
  } catch (error) {
    console.error('Validate BVN error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'BVN validation failed'
    });
  }
});

/**
 * POST /api/identity/validateNin
 * Validate NIN
 */
router.post('/validateNin', [
  body('nin').isLength({ min: 11, max: 11 }).withMessage('NIN must be 11 digits'),
  body('token').notEmpty().withMessage('NIBSS token is required')
], validateRequest, async (req, res) => {
  try {
    const { nin, token } = req.body;

    // Call NIBSS API to validate NIN
    const nibssResponse = await nibssService.validateNin(nin, token);

    // Check local database
    const ninRecord = await NIN.findOne({ nin });

    res.status(200).json({
      success: true,
      message: 'NIN validation successful',
      data: {
        valid: nibssResponse.valid || true,
        nin: nibssResponse.nin || nin,
        firstName: nibssResponse.firstName,
        lastName: nibssResponse.lastName,
        dateOfBirth: nibssResponse.dob,
        isRegisteredLocally: !!ninRecord
      }
    });
  } catch (error) {
    console.error('Validate NIN error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'NIN validation failed'
    });
  }
});

/**
 * GET /api/identity/bvn/:bvn
 * Get BVN record
 */
router.get('/bvn/:bvn', async (req, res) => {
  try {
    const bvnRecord = await BVN.findOne({ bvn: req.params.bvn });
    if (!bvnRecord) {
      return res.status(404).json({
        success: false,
        message: 'BVN record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bvnRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/identity/nin/:nin
 * Get NIN record
 */
router.get('/nin/:nin', async (req, res) => {
  try {
    const ninRecord = await NIN.findOne({ nin: req.params.nin });
    if (!ninRecord) {
      return res.status(404).json({
        success: false,
        message: 'NIN record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ninRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
