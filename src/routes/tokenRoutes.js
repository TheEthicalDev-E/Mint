const express = require('express');
const { validateTokenCreation } = require('../middleware/validators');
const { verifyWalletSignature } = require('../middleware/auth');
const { createToken } = require('../services/tokenService');
const { collectFee } = require('../services/paymentService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/tokens/create
 * @desc Create a new SPL token on Solana
 * @access Private - requires wallet signature
 */
router.post('/create', verifyWalletSignature, validateTokenCreation, async (req, res, next) => {
  try {
    const { name, symbol, decimals, walletAddress } = req.body;
    
    // First collect the fee
    logger.info(`Collecting 0.2 SOL fee from wallet: ${walletAddress}`);
    const feeResult = await collectFee(walletAddress);
    
    if (!feeResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to collect token creation fee',
        error: feeResult.error
      });
    }
    
    // Then create the token
    logger.info(`Creating token: ${name} (${symbol}) for wallet: ${walletAddress}`);
    const result = await createToken({
      name,
      symbol,
      decimals: decimals || 9, // Default to 9 decimals for meme tokens
      walletAddress
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Token creation failed',
        error: result.error
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Token created successfully',
      data: {
        tokenId: result.tokenId,
        name,
        symbol,
        decimals: decimals || 9,
        transactionSignature: result.transactionSignature
      }
    });
  } catch (error) {
    logger.error('Error in token creation:', error);
    next(error);
  }
});

/**
 * @route GET /api/tokens/trending
 * @desc Get trending tokens from pump.fun
 * @access Public
 */
router.get('/trending', async (req, res, next) => {
  try {
    const { getTrendingTokens } = require('../services/pumpFunService');
    const trendingTokens = await getTrendingTokens();
    
    return res.status(200).json({
      success: true,
      data: trendingTokens
    });
  } catch (error) {
    logger.error('Error fetching trending tokens:', error);
    next(error);
  }
});

/**
 * @route GET /api/tokens/new
 * @desc Get new tokens from pump.fun
 * @access Public
 */
router.get('/new', async (req, res, next) => {
  try {
    const { getNewTokens } = require('../services/pumpFunService');
    const newTokens = await getNewTokens();
    
    return res.status(200).json({
      success: true,
      data: newTokens
    });
  } catch (error) {
    logger.error('Error fetching new tokens:', error);
    next(error);
  }
});

module.exports = router;
