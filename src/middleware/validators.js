const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validate token creation request
 */
const validateTokenCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(50).required()
      .messages({
        'string.empty': 'Token name is required',
        'string.min': 'Token name must be at least 1 character',
        'string.max': 'Token name must be less than 50 characters'
      }),
    symbol: Joi.string().min(1).max(10).required()
      .messages({
        'string.empty': 'Token symbol is required',
        'string.min': 'Token symbol must be at least 1 character',
        'string.max': 'Token symbol must be less than 10 characters'
      }),
    decimals: Joi.number().integer().min(0).max(9).default(9)
      .messages({
        'number.base': 'Decimals must be a number',
        'number.integer': 'Decimals must be an integer',
        'number.min': 'Decimals must be at least 0',
        'number.max': 'Decimals must be less than 10'
      }),
    walletAddress: Joi.string().required()
      .messages({
        'string.empty': 'Wallet address is required'
      }),
    signature: Joi.string().required()
      .messages({
        'string.empty': 'Signature is required'
      })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    logger.warn('Token creation validation error:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  // Validation passed, update request with validated values
  req.body = value;
  next();
};

/**
 * Validate wallet balance check request
 */
const validateWalletBalance = (req, res, next) => {
  const schema = Joi.object({
    walletAddress: Joi.string().required()
      .messages({
        'string.empty': 'Wallet address is required'
      })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    logger.warn('Wallet balance validation error:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  // Validation passed, update request with validated values
  req.body = value;
  next();
};

module.exports = {
  validateTokenCreation,
  validateWalletBalance
};
