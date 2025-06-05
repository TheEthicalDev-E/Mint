const setupRoutes = (app) => {
  // Import route modules
  const tokenRoutes = require('./tokenRoutes');
  const paymentRoutes = require('./paymentRoutes');
  const adminRoutes = require('./adminRoutes');
  
  // Register routes with base paths
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
  
  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });
};

module.exports = {
  setupRoutes
};
