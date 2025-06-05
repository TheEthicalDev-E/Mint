// Enhanced security middleware for production
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

/**
 * Configure enhanced security middleware for the application
 * @param {express.Application} app - Express application instance
 */
const configureSecurityMiddleware = (app) => {
  // Add request ID to each request for better tracing
  app.use((req, res, next) => {
    req.id = uuidv4();
    next();
  });

  // Enhanced Helmet configuration for better security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for some UI components
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://pump.fun", "https://*.solana.com"],
        connectSrc: ["'self'", "https://*.solana.com", "https://api.mainnet-beta.solana.com", "https://api.devnet.solana.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for wallet connections
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Required for wallet popups
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required for external resources
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Enhanced CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }));

  // IP-based blocking for repeated failed attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 failed attempts
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: 'Too many failed attempts, please try again after 15 minutes',
    keyGenerator: (req) => {
      return req.ip; // Use IP address as the key
    },
  });

  // Apply login limiter to sensitive routes
  app.use('/api/admin/*', loginLimiter);

  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api', apiLimiter);

  // Token creation specific rate limiting
  const tokenCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 token creations per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many token creation requests, please try again later',
  });
  app.use('/api/tokens/create', tokenCreationLimiter);

  // Security logging middleware
  app.use((req, res, next) => {
    // Log only security-relevant information
    const securityLog = {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
    };
    
    // Log security events
    if (req.path.startsWith('/api/admin') || req.path.includes('token')) {
      console.log('SECURITY_EVENT', JSON.stringify(securityLog));
    }
    
    next();
  });
};

module.exports = configureSecurityMiddleware;
