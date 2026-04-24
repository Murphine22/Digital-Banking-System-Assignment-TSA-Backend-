import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';

// Load environment variables
dotenv.config();

// Import routes
import fintechRoutes from './routes/fintechRoutes.js';
import identityRoutes from './routes/identityRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Swagger UI
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    url: '/api/swagger.json'
  }
}));

// Swagger JSON
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digital Banking System API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/fintech', fintechRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transaction', transactionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digital Banking System API',
    version: '1.0.0',
    documentation: 'http://localhost:3000/api/docs',
    endpoints: {
      fintech: '/api/fintech',
      identity: '/api/identity',
      customer: '/api/customer',
      account: '/api/account',
      transaction: '/api/transaction',
      health: '/health',
      swagger: '/api/docs',
      swaggerJson: '/api/swagger.json'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Digital Banking System - NIBSS Phoenix Integration      ║
║                                                            ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║  📊 MongoDB: Connected                                     ║
║  🔌 NIBSS API: ${process.env.NIBSS_BASE_URL}  ║
║                                                            ║
║  Available Endpoints:                                      ║
║  - POST   /api/fintech/onboard                             ║
║  - POST   /api/fintech/login                               ║
║  - POST   /api/identity/insertBvn                          ║
║  - POST   /api/identity/insertNin                          ║
║  - POST   /api/identity/validateBvn                        ║
║  - POST   /api/identity/validateNin                        ║
║  - POST   /api/customer/onboard                            ║
║  - POST   /api/customer/account/create                     ║
║  - GET    /api/account/:accountNumber/balance              ║
║  - GET    /api/account/:accountNumber/name-enquiry         ║
║  - POST   /api/transaction/transfer                        ║
║  - GET    /api/transaction/:transactionId                  ║
║  - GET    /api/transaction/account/:accountId              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;
