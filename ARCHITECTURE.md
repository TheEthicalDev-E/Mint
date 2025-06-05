# Mint Launcher Backend Architecture

## Overview
This document outlines the architecture for the secure backend of the Mint Launcher platform, which handles sensitive operations such as token creation, fee collection, and wallet interactions.

## Security Principles
- All sensitive operations are authenticated and authorized
- Rate limiting to prevent abuse
- Input validation for all API endpoints
- Secure key management for admin wallet
- Comprehensive logging and monitoring
- Error handling that doesn't expose sensitive information

## Components

### 1. API Layer
- RESTful API endpoints for token creation, fee collection, and trending tokens
- Authentication middleware for secure operations
- Rate limiting to prevent abuse
- CORS configuration to allow only the frontend application

### 2. Solana Integration Layer
- SPL Token creation using @solana/spl-token
- Fee collection to admin wallet
- Transaction verification and confirmation
- Connection to Solana devnet (for testing) and mainnet (for production)

### 3. Security Layer
- Input validation using Joi
- Helmet for HTTP security headers
- Rate limiting for API endpoints
- Error handling middleware
- Logging with Winston

### 4. Data Layer
- Trending tokens data from pump.fun
- Token creation records
- Transaction history

## API Endpoints

### Token Creation
- `POST /api/tokens/create`
  - Creates a new SPL token on Solana
  - Requires wallet signature for authentication
  - Collects 0.2 SOL fee to admin wallet
  - Returns token ID and confirmation

### Fee Collection
- `POST /api/payments/fee`
  - Processes 0.2 SOL payment to admin wallet
  - Requires wallet signature for authentication
  - Returns transaction confirmation

### Trending Tokens
- `GET /api/tokens/trending`
  - Returns trending tokens from pump.fun
  - Includes token images and market data
  - No authentication required

### Admin Operations
- `GET /api/admin/transactions`
  - Returns transaction history for admin
  - Requires admin authentication
  - Includes fee collection details

## Security Measures
1. All API endpoints validate input data
2. Rate limiting to prevent abuse
3. HTTPS for all communications
4. Secure key management for admin wallet
5. Comprehensive logging for audit trail
6. Error handling that doesn't expose sensitive information

## Deployment
- Node.js backend deployed on secure server
- Environment variables for sensitive configuration
- Regular security updates and patches
