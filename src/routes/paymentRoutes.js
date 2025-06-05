const express = require('express');
const { validateWalletBalance } = require('../middleware/validators');
const { verifyWalletSignature } = require('../middleware/auth');
const { collectFee } = require('../services/paymentService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/payments/fee
 * @desc Collect token creation fee (0.2 SOL)
 * @access Private - requires wallet signature
 */
router.post('/fee', verifyWalletSignature, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    logger.info(`Processing fee payment from wallet: ${walletAddress}`);
    const result = await collectFee(walletAddress);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to collect fee',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Fee collected successfully',
      data: {
        amount: result.amount,
        transactionSignature: result.transactionSignature
      }
    });
  } catch (error) {
    logger.error('Error in fee collection:', error);
    next(error);
  }
});

/**
 * @route POST /api/payments/verify-balance
 * @desc Verify wallet has sufficient balance for token creation
 * @access Public
 */
router.post('/verify-balance', validateWalletBalance, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const { verifyWalletBalance } = require('../services/paymentService');
    
    logger.info(`Verifying balance for wallet: ${walletAddress}`);
    const result = await verifyWalletBalance(walletAddress);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify wallet balance',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        hasEnoughBalance: result.hasEnoughBalance,
        balance: result.balance,
        minimumRequired: result.minimumRequired
      }
    });
  } catch (error) {
    logger.error('Error verifying wallet balance:', error);
    next(error);
  }
});

module.exports = router;
