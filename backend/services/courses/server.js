const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const DatabaseConnection = require('../../config/database');
const RedisClient = require('../../config/redis');
const ElasticsearchClient = require('../../config/elasticsearch');
const CourseSchema = require('./models/Course');

require('dotenv').config();

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3002;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `courses-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Database and external services
let Course;

// Initialize connections
async function initializeServices() {
  try {
    // MongoDB
    const connection = await DatabaseConnection.connect('course_service', process.env.MONGODB_URI);
    Course = connection.model('Course', CourseSchema);
    console.log('✅ Course Service: Database models initialized');

    // Redis
    await RedisClient.connect();
    console.log('✅ Course Service: Redis connected');

    // Elasticsearch
    await ElasticsearchClient.connect();
    console.log('✅ Course Service: Elasticsearch connected');

    // Sync existing courses to Elasticsearch
    await syncCoursesToElasticsearch();
  } catch (error) {
    console.error('❌ Course Service: Initialization failed:', error);
    // Don't exit - some services might still work
  }
}

// Sync courses to Elasticsearch
async function syncCoursesToElasticsearch() {
  try {
    if (!ElasticsearchClient.isHealthy()) {
      console.log('Elasticsearch not available, skipping sync');
      return;
    }

    const courses = await Course.find({ status: 'published' }).limit(1000);
    console.log(`Syncing ${courses.length} courses to Elasticsearch...`);

    for (const course of courses) {
      await ElasticsearchClient.indexCourse(course);
    }

    console.log('✅ Courses synced to Elasticsearch successfully');
  } catch (error) {
    console.error('❌ Error syncing courses to Elasticsearch:', error);
  }
}

// Utility functions
const getCacheKey = (prefix, ...params) => {
  return `courses:${prefix}:${params.join(':')}`;
};

// Authentication middleware (basic version for demo)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // In production, verify with auth service
    // For demo purposes, we'll accept any token
    req.user = { id: 'demo-user', role: 'admin' };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Course Service is healthy',
    timestamp: new Date().toISOString(),
    service: 'courses',
    connections: {
      mongodb: !!Course,
      redis: RedisClient.isConnected,
      elasticsearch: ElasticsearchClient.isHealthy()
    }
  });
});

// Get all courses with pagination and filtering
app.get('/api/courses', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      instructor,
      level,
      status = 'published',
      sort = 'created_at',
      order = 'desc',
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = getCacheKey('list', pageNum, limitNum, category || 'all', instructor || 'all', level || 'all', status, sort, order, search || 'none');

    // Try to get from cache first
    let cachedResult = await RedisClient.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        message: 'Courses retrieved from cache',
        data: cachedResult,
        cached: true
      });
    }

    // Build query
    const query = { status };
    
    if (category) query.category = category;
    if (instructor) query.instructor = new RegExp(instructor, 'i');
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { instructor: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Build sort
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Execute query
    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(query)
    ]);

    const result = {
      courses,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum,
        has_next: pageNum < Math.ceil(total / limitNum),
        has_prev: pageNum > 1
      }
    };

    // Cache the result for 5 minutes
    await RedisClient.set(cacheKey, result, 300);

    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving courses'
    });
  }
});

// Search courses using Elasticsearch
app.get('/api/courses/search', async (req, res) => {
  try {
    const {
      q,
      category,
      instructor,
      page = 1,
      size = 10
    } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build cache key for search results
    const cacheKey = getCacheKey('search', q, category || 'all', instructor || 'all', page, size);

    // Try cache first
    let cachedResult = await RedisClient.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        message: 'Search results retrieved from cache',
        data: cachedResult,
        cached: true
      });
    }

    // Search using Elasticsearch
    const searchResults = await ElasticsearchClient.searchCourses(
      q.trim(),
      { category, instructor },
      parseInt(page),
      parseInt(size)
    );

    const result = {
      courses: searchResults.hits,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(searchResults.total / parseInt(size)),
        total_items: searchResults.total,
        items_per_page: parseInt(size),
        has_next: parseInt(page) < Math.ceil(searchResults.total / parseInt(size)),
        has_prev: parseInt(page) > 1
      },
      query: q
    };

    // Cache search results for 2 minutes
    await RedisClient.set(cacheKey, result, 120);

    res.json({
      success: true,
      message: 'Courses searched successfully',
      data: result
    });
  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during course search'
    });
  }
});

// Get single course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cacheKey = getCacheKey('single', id);
    let cachedCourse = await RedisClient.get(cacheKey);
    
    if (cachedCourse) {
      return res.json({
        success: true,
        message: 'Course retrieved from cache',
        data: { course: cachedCourse },
        cached: true
      });
    }

    // Find by MongoDB ObjectId or course_id
    const course = await Course.findOne({
      $or: [
        { _id: id },
        { course_id: id.toUpperCase() }
      ]
    }).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Cache for 10 minutes
    await RedisClient.set(cacheKey, course, 600);

    res.json({
      success: true,
      message: 'Course retrieved successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving course'
    });
  }
});

// Upload courses from CSV
app.post('/api/courses/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const results = [];
    const errors = [];
    const filePath = req.file.path;

    // Parse CSV
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    await parsePromise;

    if (results.length === 0) {
      fs.unlinkSync(filePath); // Clean up
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or invalid'
      });
    }

    const coursesToSave = [];
    const requiredFields = ['title', 'description', 'category', 'instructor', 'duration'];

    // Validate and prepare courses
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 1;

      // Check required fields
      const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');
      if (missingFields.length > 0) {
        errors.push(`Row ${rowNum}: Missing required fields: ${missingFields.join(', ')}`);
        continue;
      }

      // Prepare course data
      const courseData = {
        course_id: row.course_id?.toUpperCase().trim(),
        title: row.title?.trim(),
        description: row.description?.trim(),
        category: row.category?.trim(),
        instructor: row.instructor?.trim(),
        duration: parseFloat(row.duration) || 0,
        level: row.level?.trim() || 'Beginner',
        price: parseFloat(row.price) || 0,
        rating: Math.min(parseFloat(row.rating) || 0, 5),
        tags: row.tags ? row.tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
        prerequisites: row.prerequisites ? row.prerequisites.split(',').map(p => p.trim()) : [],
        learning_outcomes: row.learning_outcomes ? row.learning_outcomes.split(',').map(o => o.trim()) : [],
        thumbnail_url: row.thumbnail_url?.trim() || 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg'
      };

      // Validate category
      const validCategories = [
        'Programming', 'Data Science', 'Web Development', 'Mobile Development',
        'Machine Learning', 'DevOps', 'Database', 'Cloud Computing', 
        'Cybersecurity', 'UI/UX Design', 'Digital Marketing', 'Business', 'Other'
      ];

      if (!validCategories.includes(courseData.category)) {
        courseData.category = 'Other';
      }

      // Validate level
      const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
      if (!validLevels.includes(courseData.level)) {
        courseData.level = 'Beginner';
      }

      coursesToSave.push(courseData);
    }

    if (coursesToSave.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'No valid courses found in CSV',
        errors
      });
    }

    // Save courses to database
    const savedCourses = [];
    const saveErrors = [];

    for (const courseData of coursesToSave) {
      try {
        const course = new Course(courseData);
        const savedCourse = await course.save();
        savedCourses.push(savedCourse);

        // Index in Elasticsearch
        if (ElasticsearchClient.isHealthy()) {
          await ElasticsearchClient.indexCourse(savedCourse);
        }
      } catch (error) {
        if (error.code === 11000) {
          saveErrors.push(`Course with ID ${courseData.course_id} already exists`);
        } else {
          saveErrors.push(`Error saving course "${courseData.title}": ${error.message}`);
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Clear relevant cache
    const cachePattern = getCacheKey('list', '*');
    // Note: In production, you might want to use a more sophisticated cache invalidation

    res.json({
      success: true,
      message: 'CSV upload processed successfully',
      data: {
        total_rows: results.length,
        valid_courses: coursesToSave.length,
        saved_courses: savedCourses.length,
        courses: savedCourses
      },
      errors: [...errors, ...saveErrors]
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during CSV upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new course
app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      created_by: req.user.id
    };

    const course = new Course(courseData);
    const savedCourse = await course.save();

    // Index in Elasticsearch
    if (ElasticsearchClient.isHealthy()) {
      await ElasticsearchClient.indexCourse(savedCourse);
    }

    // Clear cache
    await RedisClient.del(getCacheKey('list', '*'));

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course: savedCourse }
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Course with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating course'
    });
  }
});

// Get course statistics
app.get('/api/courses/stats/overview', async (req, res) => {
  try {
    // Try cache first
    const cacheKey = getCacheKey('stats', 'overview');
    let cachedStats = await RedisClient.get(cacheKey);
    
    if (cachedStats) {
      return res.json({
        success: true,
        message: 'Statistics retrieved from cache',
        data: cachedStats,
        cached: true
      });
    }

    // Get statistics from database
    const [stats, categoryStats] = await Promise.all([
      Course.aggregate([
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            totalEnrollments: { $sum: '$enrollments' },
            averageRating: { $avg: '$rating' },
            averageDuration: { $avg: '$duration' },
            averagePrice: { $avg: '$price' }
          }
        },
        {
          $project: {
            _id: 0,
            totalCourses: 1,
            totalEnrollments: 1,
            averageRating: { $round: ['$averageRating', 2] },
            averageDuration: { $round: ['$averageDuration', 1] },
            averagePrice: { $round: ['$averagePrice', 2] }
          }
        }
      ]),
      Course.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalEnrollments: { $sum: '$enrollments' },
            averageRating: { $avg: '$rating' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    const result = {
      overview: stats[0] || {
        totalCourses: 0,
        totalEnrollments: 0,
        averageRating: 0,
        averageDuration: 0,
        averagePrice: 0
      },
      categories: categoryStats.map(cat => ({
        category: cat._id,
        courseCount: cat.count,
        totalEnrollments: cat.totalEnrollments,
        averageRating: Math.round(cat.averageRating * 100) / 100
      }))
    };

    // Cache for 15 minutes
    await RedisClient.set(cacheKey, result, 900);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving statistics'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Course Service Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found in Course Service`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Course Service: Received SIGTERM, shutting down gracefully');
  await Promise.all([
    DatabaseConnection.closeAll(),
    RedisClient.disconnect()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Course Service: Received SIGINT, shutting down gracefully');
  await Promise.all([
    DatabaseConnection.closeAll(),
    RedisClient.disconnect()
  ]);
  process.exit(0);
});

// Initialize services and start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Course Service running on port ${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;