const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const DatabaseConnection = require('../../config/database');
const RedisClient = require('../../config/redis');
const CourseSchema = require('../courses/models/Course');

require('dotenv').config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3003;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - more restrictive for AI service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for AI service
  message: {
    error: 'Too many AI recommendation requests, please try again later.'
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
let Course;

// Initialize services
async function initializeServices() {
  try {
    // MongoDB
    const connection = await DatabaseConnection.connect('ai_service', process.env.MONGODB_URI);
    Course = connection.model('Course', CourseSchema);
    console.log('✅ AI Service: Database models initialized');

    // Redis
    await RedisClient.connect();
    console.log('✅ AI Service: Redis connected');
  } catch (error) {
    console.error('❌ AI Service: Initialization failed:', error);
  }
}

// Utility functions
const getCacheKey = (prefix, ...params) => {
  return `ai:${prefix}:${params.join(':')}`;
};

// Mock Gemini AI API call (replace with actual implementation)
async function callGeminiAPI(prompt, preferences) {
  try {
    // Note: Replace this with actual Gemini AI API call
    // const response = await axios.post(`${process.env.GEMINI_API_URL}/generateContent`, {
    //   prompt: prompt,
    //   preferences: preferences
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // });

    // For demo purposes, return mock recommendations based on preferences
    const mockRecommendations = generateMockRecommendations(preferences);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockRecommendations;
  } catch (error) {
    console.error('Gemini API call error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

// Generate mock recommendations based on preferences
function generateMockRecommendations(preferences) {
  const { topics = [], skill_level = 'Beginner', learning_goals = [], preferred_duration = 'any' } = preferences;
  
  // Base recommendations
  const baseRecommendations = [
    {
      title: 'Complete Web Development Bootcamp',
      description: 'Learn HTML, CSS, JavaScript, React, and Node.js in one comprehensive course',
      category: 'Web Development',
      instructor: 'John Smith',
      duration: 40,
      level: 'Beginner',
      rating: 4.8,
      relevance_score: 0.95,
      reasons: ['Matches your web development interest', 'Perfect for beginners', 'Comprehensive curriculum']
    },
    {
      title: 'Python for Data Science',
      description: 'Master Python programming and data analysis with pandas, numpy, and matplotlib',
      category: 'Data Science',
      instructor: 'Sarah Johnson',
      duration: 25,
      level: 'Intermediate',
      rating: 4.7,
      relevance_score: 0.88,
      reasons: ['Great for data science career', 'Python is versatile', 'High job demand']
    },
    {
      title: 'Machine Learning Fundamentals',
      description: 'Introduction to ML algorithms, supervised and unsupervised learning',
      category: 'Machine Learning',
      instructor: 'Dr. Michael Chen',
      duration: 30,
      level: 'Intermediate',
      rating: 4.6,
      relevance_score: 0.82,
      reasons: ['Trending technology', 'High-paying career path', 'Future-proof skill']
    },
    {
      title: 'Cloud Computing with AWS',
      description: 'Learn Amazon Web Services, EC2, S3, Lambda, and cloud architecture',
      category: 'Cloud Computing',
      instructor: 'Emily Davis',
      duration: 35,
      level: 'Intermediate',
      rating: 4.5,
      relevance_score: 0.79,
      reasons: ['Cloud skills in high demand', 'AWS market leader', 'Scalable career growth']
    },
    {
      title: 'UI/UX Design Masterclass',
      description: 'Design user-centered interfaces with Figma, Adobe XD, and design principles',
      category: 'UI/UX Design',
      instructor: 'Alex Thompson',
      duration: 20,
      level: 'Beginner',
      rating: 4.7,
      relevance_score: 0.75,
      reasons: ['Creative and technical balance', 'Growing field', 'User-focused approach']
    },
    {
      title: 'JavaScript Advanced Concepts',
      description: 'Deep dive into closures, promises, async/await, and modern ES6+ features',
      category: 'Programming',
      instructor: 'Maria Rodriguez',
      duration: 18,
      level: 'Advanced',
      rating: 4.8,
      relevance_score: 0.73,
      reasons: ['JavaScript is everywhere', 'Advanced concepts', 'Career advancement']
    }
  ];

  // Filter and rank recommendations based on preferences
  let recommendations = baseRecommendations.slice();

  // Filter by topics if specified
  if (topics.length > 0) {
    recommendations = recommendations.filter(rec => 
      topics.some(topic => 
        rec.category.toLowerCase().includes(topic.toLowerCase()) ||
        rec.title.toLowerCase().includes(topic.toLowerCase()) ||
        rec.description.toLowerCase().includes(topic.toLowerCase())
      )
    );
  }

  // Filter by skill level
  if (skill_level && skill_level !== 'any') {
    recommendations = recommendations.filter(rec => {
      if (skill_level === 'Beginner') {
        return rec.level === 'Beginner' || rec.level === 'Intermediate';
      } else if (skill_level === 'Intermediate') {
        return rec.level === 'Intermediate' || rec.level === 'Advanced';
      } else {
        return rec.level === 'Advanced';
      }
    });
  }

  // Filter by preferred duration
  if (preferred_duration && preferred_duration !== 'any') {
    const durationMap = {
      'short': [1, 15],
      'medium': [16, 30],
      'long': [31, 100]
    };
    
    if (durationMap[preferred_duration]) {
      const [min, max] = durationMap[preferred_duration];
      recommendations = recommendations.filter(rec => 
        rec.duration >= min && rec.duration <= max
      );
    }
  }

  // Adjust relevance scores based on preferences
  recommendations = recommendations.map(rec => {
    let score = rec.relevance_score;
    
    // Boost score for matching skill level
    if (rec.level === skill_level) {
      score += 0.1;
    }
    
    // Boost score for matching learning goals
    learning_goals.forEach(goal => {
      if (rec.description.toLowerCase().includes(goal.toLowerCase()) ||
          rec.reasons.some(reason => reason.toLowerCase().includes(goal.toLowerCase()))) {
        score += 0.05;
      }
    });
    
    return {
      ...rec,
      relevance_score: Math.min(score, 1.0) // Cap at 1.0
    };
  });

  // Sort by relevance score
  recommendations.sort((a, b) => b.relevance_score - a.relevance_score);

  // Limit to top 6 recommendations
  return recommendations.slice(0, 6);
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Recommendations Service is healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-recommendations',
    connections: {
      mongodb: !!Course,
      redis: RedisClient.isConnected
    }
  });
});

// Get AI-powered course recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const {
      topics = [],
      skill_level = 'Beginner',
      learning_goals = [],
      preferred_duration = 'any',
      budget_range = 'any',
      exclude_categories = []
    } = req.body;

    // Validation
    if (!Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        message: 'Topics must be an array'
      });
    }

    const validSkillLevels = ['Beginner', 'Intermediate', 'Advanced', 'any'];
    if (!validSkillLevels.includes(skill_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill level. Must be one of: ' + validSkillLevels.join(', ')
      });
    }

    // Create cache key based on preferences
    const preferencesHash = Buffer.from(JSON.stringify({
      topics: topics.sort(),
      skill_level,
      learning_goals: learning_goals.sort(),
      preferred_duration,
      budget_range,
      exclude_categories: exclude_categories.sort()
    })).toString('base64');
    
    const cacheKey = getCacheKey('recommendations', preferencesHash);

    // Try to get from cache first
    let cachedRecommendations = await RedisClient.get(cacheKey);
    if (cachedRecommendations) {
      return res.json({
        success: true,
        message: 'Recommendations retrieved from cache',
        data: {
          recommendations: cachedRecommendations,
          preferences_used: {
            topics,
            skill_level,
            learning_goals,
            preferred_duration,
            budget_range,
            exclude_categories
          }
        },
        cached: true
      });
    }

    // Prepare preferences for AI
    const preferences = {
      topics,
      skill_level,
      learning_goals,
      preferred_duration,
      budget_range,
      exclude_categories
    };

    // Create prompt for Gemini AI
    const prompt = `
      Based on the following user preferences, recommend relevant courses:
      - Topics of interest: ${topics.join(', ') || 'Open to all topics'}
      - Skill level: ${skill_level}
      - Learning goals: ${learning_goals.join(', ') || 'General skill improvement'}
      - Preferred duration: ${preferred_duration}
      - Budget range: ${budget_range}
      - Categories to exclude: ${exclude_categories.join(', ') || 'None'}
      
      Please provide course recommendations that match these preferences with explanations for why each course is recommended.
    `;

    // Call AI service (mock implementation)
    const aiRecommendations = await callGeminiAPI(prompt, preferences);

    // Enhance recommendations with real course data if available
    const enhancedRecommendations = await enhanceRecommendationsWithRealData(aiRecommendations, preferences);

    // Cache the recommendations for 1 hour
    await RedisClient.set(cacheKey, enhancedRecommendations, 3600);

    res.json({
      success: true,
      message: 'AI recommendations generated successfully',
      data: {
        recommendations: enhancedRecommendations,
        preferences_used: preferences,
        ai_generated: true
      }
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhance AI recommendations with real course data
async function enhanceRecommendationsWithRealData(aiRecommendations, preferences) {
  try {
    if (!Course) {
      return aiRecommendations;
    }

    // Get some real courses that match the preferences
    const query = { status: 'published' };
    
    if (preferences.topics.length > 0) {
      query.$or = preferences.topics.map(topic => ({
        $or: [
          { category: new RegExp(topic, 'i') },
          { title: new RegExp(topic, 'i') },
          { description: new RegExp(topic, 'i') },
          { tags: new RegExp(topic, 'i') }
        ]
      }));
    }

    if (preferences.skill_level && preferences.skill_level !== 'any') {
      query.level = preferences.skill_level;
    }

    if (preferences.exclude_categories.length > 0) {
      query.category = { $nin: preferences.exclude_categories };
    }

    const realCourses = await Course.find(query)
      .limit(3)
      .sort({ rating: -1, enrollments: -1 })
      .lean();

    // Merge AI recommendations with real course data
    const enhancedRecommendations = [...aiRecommendations];

    realCourses.forEach((course, index) => {
      if (index < aiRecommendations.length) {
        // Replace some AI recommendations with real courses
        enhancedRecommendations[index + 3] = {
          ...course,
          course_id: course.course_id || course._id,
          relevance_score: 0.85 - (index * 0.05),
          reasons: [
            'Real course with verified ratings',
            `${course.enrollments} students enrolled`,
            'Available in our catalog'
          ],
          is_real_course: true
        };
      }
    });

    return enhancedRecommendations.slice(0, 6); // Limit to 6 recommendations
  } catch (error) {
    console.error('Error enhancing recommendations:', error);
    return aiRecommendations;
  }
}

// Get trending courses based on AI analysis
app.get('/api/recommendations/trending', async (req, res) => {
  try {
    const cacheKey = getCacheKey('trending', 'courses');

    // Try cache first
    let cachedTrending = await RedisClient.get(cacheKey);
    if (cachedTrending) {
      return res.json({
        success: true,
        message: 'Trending courses retrieved from cache',
        data: { courses: cachedTrending },
        cached: true
      });
    }

    // Generate trending courses based on enrollments and ratings
    const trendingCourses = await Course.find({ status: 'published' })
      .sort({ 
        enrollments: -1, 
        rating: -1, 
        created_at: -1 
      })
      .limit(10)
      .lean();

    // Add AI-generated trending scores
    const coursesWithTrendingScore = trendingCourses.map((course, index) => ({
      ...course,
      trending_score: Math.max(0.9 - (index * 0.08), 0.2),
      trending_reasons: [
        `${course.enrollments} recent enrollments`,
        `${course.rating}/5 rating`,
        'High engagement rate',
        'Growing demand in industry'
      ]
    }));

    // Cache for 30 minutes
    await RedisClient.set(cacheKey, coursesWithTrendingScore, 1800);

    res.json({
      success: true,
      message: 'Trending courses retrieved successfully',
      data: { courses: coursesWithTrendingScore }
    });
  } catch (error) {
    console.error('Trending courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving trending courses'
    });
  }
});

// Get personalized learning path
app.post('/api/recommendations/learning-path', async (req, res) => {
  try {
    const {
      current_skills = [],
      career_goal = '',
      time_commitment = 'flexible',
      experience_level = 'Beginner'
    } = req.body;

    const cacheKey = getCacheKey('learning-path', 
      current_skills.join(','), career_goal, time_commitment, experience_level);

    // Try cache first
    let cachedPath = await RedisClient.get(cacheKey);
    if (cachedPath) {
      return res.json({
        success: true,
        message: 'Learning path retrieved from cache',
        data: cachedPath,
        cached: true
      });
    }

    // Generate learning path based on career goal and current skills
    const learningPath = generateLearningPath(current_skills, career_goal, time_commitment, experience_level);

    // Cache for 2 hours
    await RedisClient.set(cacheKey, learningPath, 7200);

    res.json({
      success: true,
      message: 'Learning path generated successfully',
      data: learningPath
    });
  } catch (error) {
    console.error('Learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating learning path'
    });
  }
});

// Generate learning path (mock implementation)
function generateLearningPath(currentSkills, careerGoal, timeCommitment, experienceLevel) {
  const learningPaths = {
    'web developer': [
      { phase: 'Foundation', duration: '2-3 months', skills: ['HTML', 'CSS', 'JavaScript'] },
      { phase: 'Frontend Framework', duration: '2-3 months', skills: ['React', 'Vue.js'] },
      { phase: 'Backend Development', duration: '3-4 months', skills: ['Node.js', 'Express', 'Database'] },
      { phase: 'Full Stack Projects', duration: '2-3 months', skills: ['API Integration', 'Deployment'] }
    ],
    'data scientist': [
      { phase: 'Programming Foundation', duration: '2-3 months', skills: ['Python', 'Statistics'] },
      { phase: 'Data Analysis', duration: '3-4 months', skills: ['Pandas', 'NumPy', 'Matplotlib'] },
      { phase: 'Machine Learning', duration: '4-5 months', skills: ['Scikit-learn', 'TensorFlow'] },
      { phase: 'Advanced Topics', duration: '3-4 months', skills: ['Deep Learning', 'NLP'] }
    ],
    'mobile developer': [
      { phase: 'Mobile Basics', duration: '2-3 months', skills: ['Mobile Design', 'Platform Choice'] },
      { phase: 'Native Development', duration: '4-5 months', skills: ['React Native', 'Flutter'] },
      { phase: 'Backend Integration', duration: '2-3 months', skills: ['APIs', 'Database'] },
      { phase: 'App Store Deployment', duration: '1-2 months', skills: ['Testing', 'Publishing'] }
    ]
  };

  const defaultPath = [
    { phase: 'Skill Assessment', duration: '1-2 weeks', skills: ['Identify gaps', 'Set goals'] },
    { phase: 'Foundation Building', duration: '1-2 months', skills: ['Core concepts', 'Best practices'] },
    { phase: 'Practical Application', duration: '2-3 months', skills: ['Projects', 'Portfolio'] },
    { phase: 'Advanced Concepts', duration: '2-4 months', skills: ['Specialization', 'Expert topics'] }
  ];

  const selectedPath = learningPaths[careerGoal.toLowerCase()] || defaultPath;

  return {
    career_goal: careerGoal,
    current_skills: currentSkills,
    experience_level: experienceLevel,
    estimated_duration: selectedPath.reduce((acc, phase) => acc + parseInt(phase.duration), 0) + ' months',
    phases: selectedPath.map((phase, index) => ({
      ...phase,
      order: index + 1,
      status: index === 0 ? 'current' : 'upcoming',
      recommended_courses: generateRecommendedCourses(phase.skills)
    })),
    time_commitment: timeCommitment,
    next_steps: [
      'Start with the Foundation phase',
      'Practice daily coding/learning',
      'Build projects to reinforce learning',
      'Join communities and network'
    ]
  };
}

function generateRecommendedCourses(skills) {
  // Mock course recommendations based on skills
  return skills.map(skill => ({
    title: `Complete ${skill} Course`,
    duration: '10-15 hours',
    difficulty: 'Beginner to Intermediate'
  }));
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('AI Service Error:', error);
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
    message: `Route ${req.originalUrl} not found in AI Recommendations Service`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('AI Service: Received SIGTERM, shutting down gracefully');
  await Promise.all([
    DatabaseConnection.closeAll(),
    RedisClient.disconnect()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('AI Service: Received SIGINT, shutting down gracefully');
  await Promise.all([
    DatabaseConnection.closeAll(),
    RedisClient.disconnect()
  ]);
  process.exit(0);
});

// Initialize services and start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AI Recommendations Service running on port ${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;