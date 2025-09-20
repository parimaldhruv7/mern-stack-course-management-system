# MERN Stack Course Management System - Setup Instructions

## 🚀 Quick Start Guide

This guide will help you set up and run your MERN stack project with all the necessary configurations.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Redis (optional, for caching)
- Elasticsearch (optional, for advanced search)

## 🛠️ Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Environment variables are already configured in .env file
# The .env file contains all necessary configurations

# Start all services
npm run start-all

# Or start individual services:
npm run auth-service    # Port 3001
npm run course-service  # Port 3002
npm run ai-service      # Port 3003
npm run dev            # API Gateway on port 3000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd sampleuniproject-waygood-sampleuniproject

# Install dependencies
npm install

# Environment variables are already configured in .env.local file

# Start the development server
npm run dev
```

### 3. Database Setup

#### MongoDB (Required)
- Install MongoDB locally or use MongoDB Atlas
- Default connection: `mongodb://localhost:27017/course_management_system`
- The application will create the necessary collections automatically

#### Redis (Optional)
- Install Redis locally or use Redis Cloud
- Default connection: `redis://localhost:6379`
- Used for caching API responses

#### Elasticsearch (Optional)
- Install Elasticsearch locally or use Elastic Cloud
- Default connection: `http://localhost:9200`
- Used for advanced course search functionality

## 🧪 Testing the Setup

### Test Backend Services

```bash
# From backend directory
npm run test-services
```

This will test:
- ✅ API Gateway health
- ✅ Auth Service health
- ✅ Course Service health
- ✅ AI Service health
- ✅ Authentication flow
- ✅ Course API endpoints
- ✅ AI recommendations

### Test Frontend

1. Open http://localhost:3000
2. Navigate to Admin Login: http://localhost:3000/admin/login
3. Create an admin account or use existing credentials
4. Test course upload functionality

## 📁 Project Structure

```
├── backend/
│   ├── services/
│   │   ├── auth/           # Authentication service
│   │   ├── courses/        # Course management service
│   │   └── ai-recommendations/ # AI recommendations service
│   ├── config/             # Database configurations
│   ├── sample-data/        # Sample CSV files
│   ├── .env               # Environment variables
│   ├── server.js          # API Gateway
│   ├── start-all.js       # Start all services
│   └── test-services.js   # Test all services
│
└── sampleuniproject-waygood-sampleuniproject/
    ├── src/
    │   ├── app/           # Next.js app router pages
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts (Auth)
    │   └── lib/           # API services and utilities
    ├── .env.local         # Frontend environment variables
    └── package.json
```

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/course_management_system
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_NODE=http://localhost:9200
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
# ... (all other variables are pre-configured)
```

### Frontend Environment Variables (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_COURSE_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3003
```

## 🎯 Key Features Implemented

### Backend
- ✅ Microservices architecture
- ✅ JWT authentication
- ✅ Course CRUD operations
- ✅ CSV file upload
- ✅ Advanced search with Elasticsearch
- ✅ Redis caching
- ✅ AI-powered recommendations
- ✅ API Gateway with routing
- ✅ Health checks for all services

### Frontend
- ✅ Next.js 15 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Authentication context
- ✅ Protected routes
- ✅ Admin dashboard
- ✅ Course upload functionality
- ✅ AI course matching
- ✅ Responsive design

## 🚀 Running the Complete Application

### Option 1: Manual Start

```bash
# Terminal 1 - Backend
cd backend
npm run start-all

# Terminal 2 - Frontend
cd sampleuniproject-waygood-sampleuniproject
npm run dev
```

### Option 2: Docker (Alternative)

```bash
# From backend directory
docker-compose up -d
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Admin registration
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile
- `POST /api/auth/verify` - Verify token

### Courses
- `GET /api/courses` - Get all courses (with pagination)
- `GET /api/courses/search` - Search courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses/upload` - Upload courses from CSV
- `POST /api/courses` - Create new course
- `GET /api/courses/stats/overview` - Get statistics

### AI Recommendations
- `POST /api/recommendations` - Get AI recommendations
- `GET /api/recommendations/trending` - Get trending courses
- `POST /api/recommendations/learning-path` - Get learning path

## 🧪 Testing with Sample Data

1. Use the sample CSV file: `backend/sample-data/sample-courses.csv`
2. Upload it through the admin dashboard
3. Test the search and recommendation features

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in .env files
2. **MongoDB connection failed**: Ensure MongoDB is running
3. **Redis connection failed**: Redis is optional, services will work without it
4. **Elasticsearch connection failed**: Elasticsearch is optional, basic search will work without it

### Health Checks

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Courses
curl http://localhost:3003/health  # AI
```

## 🎉 Success!

If everything is set up correctly, you should see:

1. ✅ All backend services running and healthy
2. ✅ Frontend accessible at http://localhost:3000
3. ✅ Admin login working
4. ✅ Course upload functionality working
5. ✅ AI recommendations working

Your MERN stack application is now fully functional and ready for development!