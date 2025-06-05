const express = require('express');
const { verifyAdminAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/admin/transactions
 * @desc Get all fee transactions for admin
 * @access Private - requires admin wallet signature
 */
router.get('/transactions', verifyAdminAccess, async (req, res, next) => {
  try {
    // In a production environment, this would fetch transaction history from a database
    // For now, we'll return mock data
    
    const transactions = [
      {
        id: 'tx1',
        walletAddress: 'user1wallet123',
        amount: 0.2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        transactionSignature: 'simulated_fee_payment_1234567890',
        status: 'completed'
      },
      {
        id: 'tx2',
        walletAddress: 'user2wallet456',
        amount: 0.2,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        transactionSignature: 'simulated_fee_payment_0987654321',
        status: 'completed'
      }
    ];
    
    logger.info('Admin fetched transaction history');
    
    return res.status(200).json({
      success: true,
      data: {
        transactions,
        totalFees: transactions.reduce((sum, tx) => sum + tx.amount, 0)
      }
    });
  } catch (error) {
    logger.error('Error fetching admin transactions:', error);
    next(error);
  }
});

/**
 * @route GET /api/admin/stats
 * @desc Get admin dashboard statistics
 * @access Private - requires admin wallet signature
 */
router.get('/stats', verifyAdminAccess, async (req, res, next) => {
  try {
    // In a production environment, this would calculate real statistics
    // For now, we'll return mock data
    
    const stats = {
      totalTokensCreated: 42,
      totalFeesCollected: 8.4, // 42 * 0.2
      activeUsers: 38,
      lastDayTransactions: 5,
      lastWeekTransactions: 18
    };
    
    logger.info('Admin fetched dashboard statistics');
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching admin statistics:', error);
    next(error);
  }
});

module.exports = router;
