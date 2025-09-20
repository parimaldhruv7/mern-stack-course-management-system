# MERN Stack Course Management System - Backend Microservices

A comprehensive backend system built with microservices architecture for a course management platform, featuring AI-powered recommendations, advanced search capabilities, and robust caching mechanisms.

## 🏗️ Architecture Overview

This system implements a microservices architecture with the following services:

### 1. Authentication Microservice (`/services/auth`)
- **Port**: 3001
- **Database**: MongoDB
- **Features**:
  - Admin-only registration and login
  - Secure password hashing with bcrypt
  - JWT token generation and validation
  - Account lockout protection
  - Protected admin routes

### 2. Course Management Microservice (`/services/courses`)
- **Port**: 3002
- **Database**: MongoDB + Elasticsearch + Redis
- **Features**:
  - CSV course data upload and parsing
  - Full-text search with Elasticsearch
  - Redis caching for performance
  - CRUD operations for courses
  - Advanced filtering and pagination
  - Course statistics and analytics

### 3. AI Recommendations Microservice (`/services/ai-recommendations`)
- **Port**: 3003
- **Database**: MongoDB + Redis
- **Features**:
  - Gemini AI integration for course recommendations
  - Personalized learning paths
  - Trending course analysis
  - Preference-based recommendations
  - Smart caching of AI responses

### 4. API Gateway (`/server.js`)
- **Port**: 3000
- **Features**:
  - Request routing to microservices
  - Health monitoring
  - Rate limiting
  - CORS configuration
  - Centralized error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Redis 7+
- Elasticsearch 8.11+
- Docker & Docker Compose (optional)

### Environment Setup

1. **Clone and install dependencies**:
```bash
git clone <your-repo>
cd mern-backend-microservices
npm install
```

2. **Configure environment variables**:
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Key configurations:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REDIS_URL`: Redis connection URL
- `ELASTICSEARCH_NODE`: Elasticsearch URL
- `GEMINI_API_KEY`: Your Gemini AI API key

### Running with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

### Running Locally

1. **Start external services**:
```bash
# MongoDB (using Docker)
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Redis (using Docker)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Elasticsearch (using Docker)
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

2. **Start microservices**:
```bash
# Terminal 1 - Auth Service
npm run auth-service

# Terminal 2 - Course Service  
npm run course-service

# Terminal 3 - AI Service
npm run ai-service

# Terminal 4 - API Gateway
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

**Base URL**: `http://localhost:3000/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Admin registration | No |
| POST | `/login` | Admin login | No |
| GET | `/profile` | Get admin profile | Yes |
| POST | `/verify` | Verify JWT token | Yes |
| GET | `/admin-only` | Protected demo route | Yes |

**Example - Admin Registration**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com", 
    "password": "password123",
    "role": "admin"
  }'
```

### Course Management Endpoints

**Base URL**: `http://localhost:3000/api/courses`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all courses (paginated) | No |
| GET | `/search` | Search courses (Elasticsearch) | No |
| GET | `/:id` | Get single course | No |
| POST | `/upload` | Upload courses from CSV | Yes |
| POST | `/` | Create new course | Yes |
| GET | `/stats/overview` | Get course statistics | No |

**Example - Search Courses**:
```bash
curl "http://localhost:3000/api/courses/search?q=javascript&category=Programming&page=1&size=5"
```

**Example - Upload CSV**:
```bash
curl -X POST http://localhost:3000/api/courses/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@courses.csv"
```

### AI Recommendations Endpoints

**Base URL**: `http://localhost:3000/api/recommendations`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Get AI recommendations | No |
| GET | `/trending` | Get trending courses | No |
| POST | `/learning-path` | Get personalized learning path | No |

**Example - Get Recommendations**:
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["javascript", "react"],
    "skill_level": "Beginner", 
    "learning_goals": ["web development"],
    "preferred_duration": "medium"
  }'
```

## 📁 Project Structure

```
├── config/
│   ├── database.js          # MongoDB connection handler
│   ├── redis.js             # Redis client configuration
│   └── elasticsearch.js     # Elasticsearch client
├── services/
│   ├── auth/
│   │   ├── models/Admin.js   # Admin user model
│   │   └── server.js        # Auth service server
│   ├── courses/
│   │   ├── models/Course.js  # Course model
│   │   └── server.js        # Course service server
│   └── ai-recommendations/
│       └── server.js        # AI service server
├── sample-data/
│   └── courses.csv          # Sample course data
├── uploads/                 # CSV upload directory
├── docker-compose.yml       # Docker services configuration
├── Dockerfile.auth          # Auth service Docker image
├── Dockerfile.courses       # Course service Docker image
├── server.js               # API Gateway
├── package.json
├── .env                    # Environment variables
└── README.md
```

## 🔒 Security Features

### Authentication Service
- Password hashing with bcryptjs (12 rounds)
- JWT tokens with expiration
- Account lockout after failed attempts
- Rate limiting on auth endpoints
- Input validation and sanitization

### API Gateway
- CORS configuration
- Helmet for security headers
- Rate limiting across all services
- Request size limits
- Error message sanitization

### General Security
- Environment variable configuration
- Non-root Docker containers
- Health check endpoints
- Graceful shutdown handling

## 🗄️ Database Schemas

### Admin Schema (Authentication Service)
```javascript
{
  username: String (required, unique),
  email: String (required, unique), 
  password: String (required, hashed),
  role: String (enum: ['admin', 'super_admin']),
  isActive: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Course Schema (Course Service)
```javascript
{
  course_id: String (required, unique),
  title: String (required),
  description: String (required),
  category: String (required, enum),
  instructor: String (required),
  duration: Number (required),
  level: String (enum: ['Beginner', 'Intermediate', 'Advanced']),
  price: Number,
  rating: Number (0-5),
  enrollments: Number,
  tags: [String],
  prerequisites: [String],
  learning_outcomes: [String],
  thumbnail_url: String,
  status: String (enum: ['draft', 'published', 'archived']),
  created_by: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Performance Optimizations

### Redis Caching Strategy
- **Course Lists**: 5-minute cache
- **Search Results**: 2-minute cache  
- **Single Courses**: 10-minute cache
- **AI Recommendations**: 1-hour cache
- **Statistics**: 15-minute cache

### Elasticsearch Indexing
- Full-text search on title, description, instructor
- Category and level filtering
- Fuzzy matching for typos
- Score-based relevance ranking
- Automatic index creation

### Database Optimizations
- Compound indexes on frequently queried fields
- Aggregation pipelines for statistics
- Connection pooling
- Query result limiting

## 🐳 Docker Deployment

### Development Environment
```bash
# Start all services in development mode
docker-compose up --build

# Scale specific services
docker-compose up --scale course-service=2

# Monitor logs
docker-compose logs -f course-service
```

### Production Deployment
1. Update environment variables for production
2. Use production MongoDB/Redis/Elasticsearch instances
3. Configure reverse proxy (Nginx)
4. Set up monitoring and logging
5. Implement backup strategies

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 CI/CD Pipeline

### Suggested Pipeline Stages

1. **Code Commit**
   - Git push to main branch
   - Webhook triggers pipeline

2. **Build Stage**
   - Install dependencies (`npm ci`)
   - Run linting (`npm run lint`)
   - Run tests (`npm test`)

3. **Test Stage**  
   - Unit tests for each microservice
   - Integration tests
   - API endpoint tests
   - Security vulnerability scanning

4. **Build Docker Images**
   - Build service images
   - Tag with version/commit hash
   - Push to container registry

5. **Deploy Stage**
   - Deploy to staging environment  
   - Run smoke tests
   - Deploy to production
   - Health check validation

### Recommended Tools
- **CI/CD**: GitHub Actions, Jenkins, GitLab CI
- **Container Registry**: Docker Hub, AWS ECR, Azure ACR
- **Orchestration**: Docker Swarm, Kubernetes
- **Monitoring**: Prometheus + Grafana, New Relic

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **API Gateway**: `GET /health`
- **Auth Service**: `GET /api/auth/health`  
- **Course Service**: `GET /api/courses/health`
- **AI Service**: `GET /api/ai/health`

### Monitoring Metrics
- Response times per endpoint
- Error rates by service
- Database connection pool status
- Redis cache hit ratios
- Elasticsearch query performance

## 🌐 Frontend Integration

### NextJS Integration Example

```javascript
// utils/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const courseApi = {
  // Get courses with pagination
  getCourses: async (params = {}) => {
    const url = new URL(`${API_BASE}/api/courses`);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );
    const response = await fetch(url);
    return response.json();
  },

  // Search courses
  searchCourses: async (query, filters = {}) => {
    const url = new URL(`${API_BASE}/api/courses/search`);
    url.searchParams.append('q', query);
    Object.keys(filters).forEach(key => 
      url.searchParams.append(key, filters[key])
    );
    const response = await fetch(url);
    return response.json();
  },

  // Get AI recommendations
  getRecommendations: async (preferences) => {
    const response = await fetch(`${API_BASE}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    return response.json();
  }
};

// Auth utilities
export const authApi = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  verifyToken: async (token) => {
    const response = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

### Sample Test Cases

```javascript
// Example test for course creation
describe('Course Management', () => {
  test('should create a new course', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      instructor: 'Test Instructor',
      duration: 10
    };
    
    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(courseData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.course.title).toBe(courseData.title);
  });
});
```

## ⚡ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   docker ps | grep mongo
   
   # Restart MongoDB
   docker restart mongodb
   ```

2. **Redis Connection Error**
   ```bash
   # Test Redis connection
   docker exec -it redis redis-cli ping
   
   # Check Redis logs
   docker logs redis
   ```

3. **Elasticsearch Not Starting**
   ```bash
   # Increase memory limits
   sysctl -w vm.max_map_count=262144
   
   # Check Elasticsearch health
   curl http://localhost:9200/_health
   ```

4. **Service Discovery Issues**
   ```bash
   # Check Docker network
   docker network ls
   docker network inspect mern-backend-microservices_app-network
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support, please:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ for the MERN Stack Assessment**