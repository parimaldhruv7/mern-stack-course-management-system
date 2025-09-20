const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Service URLs
const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
  COURSES: process.env.COURSE_SERVICE_URL || `http://localhost:${process.env.COURSE_SERVICE_PORT || 3002}`,
  AI: process.env.AI_SERVICE_URL || `http://localhost:${process.env.AI_SERVICE_PORT || 3003}`
};

// Proxy middleware
const createProxy = (serviceUrl, serviceName) => {
  return async (req, res) => {
    try {
      const targetUrl = `${serviceUrl}${req.path}`;
      
      const config = {
        method: req.method,
        url: targetUrl,
        headers: {
          ...req.headers,
          host: undefined,
        },
        timeout: 30000,
      };

      if (req.body && Object.keys(req.body).length > 0) {
        config.data = req.body;
      }

      if (req.query && Object.keys(req.query).length > 0) {
        config.params = req.query;
      }

      const response = await axios(config);
      
      // Forward response
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error(`${serviceName} Service Error:`, error.message);
      
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          success: false,
          message: `${serviceName} service is unavailable`,
          service: serviceName.toLowerCase()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          service: serviceName.toLowerCase()
        });
      }
    }
  };
};

// Health check for API Gateway
app.get('/health', async (req, res) => {
  const healthChecks = await Promise.allSettled([
    axios.get(`${SERVICES.AUTH}/health`, { timeout: 5000 }),
    axios.get(`${SERVICES.COURSES}/health`, { timeout: 5000 }),
    axios.get(`${SERVICES.AI}/health`, { timeout: 5000 })
  ]);

  const services = {
    auth: healthChecks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    courses: healthChecks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    ai: healthChecks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
  };

  const allHealthy = Object.values(services).every(status => status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    message: 'API Gateway Health Check',
    timestamp: new Date().toISOString(),
    services,
    version: '1.0.0'
  });
});

// Service routing
app.use('/api/auth/*', createProxy(SERVICES.AUTH, 'Auth'));
app.use('/api/courses/*', createProxy(SERVICES.COURSES, 'Courses'));
app.use('/api/recommendations/*', createProxy(SERVICES.AI, 'AI'));

// Additional direct service health checks
app.get('/api/auth/health', createProxy(SERVICES.AUTH, 'Auth'));
app.get('/api/courses/health', createProxy(SERVICES.COURSES, 'Courses'));
app.get('/api/ai/health', createProxy(SERVICES.AI, 'AI'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MERN Stack Course Management API Gateway',
    version: '1.0.0',
    services: {
      auth: `${SERVICES.AUTH}/api/auth`,
      courses: `${SERVICES.COURSES}/api/courses`,
      ai: `${SERVICES.AI}/api/recommendations`
    },
    endpoints: {
      auth: [
        'POST /api/auth/signup - Admin registration',
        'POST /api/auth/login - Admin login',
        'GET /api/auth/profile - Get admin profile',
        'POST /api/auth/verify - Verify token',
        'GET /api/auth/admin-only - Protected route'
      ],
      courses: [
        'GET /api/courses - Get all courses with pagination',
        'GET /api/courses/search - Search courses with Elasticsearch',
        'GET /api/courses/:id - Get single course',
        'POST /api/courses/upload - Upload courses from CSV',
        'POST /api/courses - Create new course',
        'GET /api/courses/stats/overview - Get statistics'
      ],
      ai: [
        'POST /api/recommendations - Get AI recommendations',
        'GET /api/recommendations/trending - Get trending courses',
        'POST /api/recommendations/learning-path - Get learning path'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    available_services: ['/api/auth', '/api/courses', '/api/recommendations']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Gateway Error:', error);
  res.status(500).json({
    success: false,
    message: 'API Gateway internal error'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Service URLs:');
  console.log(`   Auth Service: ${SERVICES.AUTH}`);
  console.log(`   Course Service: ${SERVICES.COURSES}`);
  console.log(`   AI Service: ${SERVICES.AI}`);
});

module.exports = app;