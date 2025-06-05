require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { setupRoutes } = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://startling-torrone-3d83f5.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Parse JSON request body
app.use(express.json());

// API routes
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Don't crash the server on unhandled rejections
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Graceful shutdown on uncaught exceptions
  process.exit(1);
});

module.exports = app; // For testing
