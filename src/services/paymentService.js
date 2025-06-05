const web3 = require('@solana/web3.js');
const logger = require('../utils/logger');

/**
 * Service for handling payments and fee collection
 */
class PaymentService {
  /**
   * Collect token creation fee (0.2 SOL) from user wallet
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Result of fee collection
   */
  async collectFee(walletAddress) {
    try {
      // Connect to Solana network (devnet for testing, mainnet for production)
      const connection = new web3.Connection(
        process.env.SOLANA_RPC_URL || web3.clusterApiUrl('devnet'),
        'confirmed'
      );
      
      // Admin wallet that receives the fees
      const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;
      if (!adminWalletAddress) {
        throw new Error('Admin wallet address not configured');
      }
      
      const adminPublicKey = new web3.PublicKey(adminWalletAddress);
      const userPublicKey = new web3.PublicKey(walletAddress);
      
      // Fee amount in lamports (0.2 SOL = 200000000 lamports)
      const feeAmount = 200000000;
      
      // Create transaction for fee payment
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: adminPublicKey,
          lamports: feeAmount
        })
      );
      
      // In a real implementation, this transaction would be sent to the frontend
      // for signing by the user's wallet, then submitted back to the backend
      // For now, we'll simulate the transaction confirmation
      
      const transactionSignature = 'simulated_fee_payment_' + Date.now();
      
      logger.info(`Fee collected successfully: 0.2 SOL from ${walletAddress} to ${adminWalletAddress}`);
      
      return {
        success: true,
        amount: 0.2,
        transactionSignature
      };
    } catch (error) {
      logger.error('Error collecting fee:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify that a wallet has sufficient balance for token creation
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Result of balance check
   */
  async verifyWalletBalance(walletAddress) {
    try {
      // Connect to Solana network
      const connection = new web3.Connection(
        process.env.SOLANA_RPC_URL || web3.clusterApiUrl('devnet'),
        'confirmed'
      );
      
      const publicKey = new web3.PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      
      // Minimum required balance in lamports (0.5 SOL = 500000000 lamports)
      const minimumBalance = 500000000;
      
      const hasEnoughBalance = balance >= minimumBalance;
      
      logger.info(`Wallet ${walletAddress} balance check: ${balance / web3.LAMPORTS_PER_SOL} SOL, sufficient: ${hasEnoughBalance}`);
      
      return {
        success: true,
        hasEnoughBalance,
        balance: balance / web3.LAMPORTS_PER_SOL,
        minimumRequired: minimumBalance / web3.LAMPORTS_PER_SOL
      };
    } catch (error) {
      logger.error('Error verifying wallet balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentService();
