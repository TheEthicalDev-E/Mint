# Mint Launcher Backend - README

## Overview
This is the secure backend for the Mint Launcher platform, a Solana meme coin creation website similar to launchtokens.fun. The backend handles sensitive operations such as token creation, fee collection, and trending token data retrieval.

## Features
- Secure API endpoints for token creation and fee collection
- Integration with Solana blockchain for SPL token creation
- Admin dashboard for monitoring transactions and earnings
- Real-time trending tokens data from pump.fun
- Robust security measures and error handling

## Architecture
The backend follows a modular architecture with clear separation of concerns:
- API Layer: Express.js routes and controllers
- Service Layer: Business logic for token creation, payments, etc.
- Blockchain Layer: Integration with Solana and SPL token program
- Security Layer: Authentication, validation, and error handling

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Solana CLI tools (for testing)

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   cd mint_launcher_project/backend
   npm install
   ```
3. Copy `sample.env` to `.env` and update the values
4. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Token Creation
- `POST /api/tokens/create`: Create a new SPL token on Solana
  - Requires wallet signature
  - Collects 0.2 SOL fee to admin wallet

### Fee Collection
- `POST /api/payments/fee`: Process fee payment
- `POST /api/payments/verify-balance`: Check if wallet has sufficient balance

### Trending Tokens
- `GET /api/tokens/trending`: Get trending tokens from pump.fun
- `GET /api/tokens/new`: Get new tokens from pump.fun

### Admin Operations
- `GET /api/admin/transactions`: Get transaction history (admin only)
- `GET /api/admin/stats`: Get dashboard statistics (admin only)

## Security Measures
- Input validation for all API endpoints
- Rate limiting to prevent abuse
- Secure wallet signature verification
- Comprehensive logging and error handling
- CORS configuration to prevent unauthorized access

## Development
- Use `npm run dev` for development with hot reloading
- All API endpoints should be thoroughly tested before production use
- Sensitive operations should be properly authenticated and authorized

## Production Deployment
- Set `NODE_ENV=production` in .env
- Use a process manager like PM2 for production deployment
- Ensure all API keys and wallet addresses are securely managed
- Configure proper CORS settings for the production frontend

## Security Considerations
- Never expose private keys in the codebase or environment variables
- Always verify wallet signatures for sensitive operations
- Implement proper error handling that doesn't expose sensitive information
- Regularly update dependencies to patch security vulnerabilities
