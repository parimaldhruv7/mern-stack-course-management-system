# MERN Full-Stack Course Management System

A comprehensive MERN stack application with microservices architecture, featuring AI-powered course recommendations, advanced search capabilities, and modern DevOps practices.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Redis (optional)
- Elasticsearch (optional)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd sampleuniproject-waygood-sampleuniproject
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run start-all
```

3. **Frontend Setup**
```bash
cd sampleuniproject-waygood-sampleuniproject
npm install
npm run dev
```

4. **Test the Application**
```bash
# From backend directory
npm run test-services
```

## 📋 Features

### Backend Microservices
- **Authentication Service**: JWT-based admin authentication
- **Course Management Service**: CRUD operations, CSV upload, search
- **AI Recommendations Service**: Gemini AI-powered course suggestions
- **API Gateway**: Request routing and load balancing

### Frontend
- **Admin Dashboard**: Course and university data management
- **AI Course Matching**: Personalized course recommendations
- **Search & Filter**: Advanced course discovery
- **Responsive Design**: Mobile-friendly interface

### DevOps
- **Docker Support**: Containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **Monitoring**: Health checks and logging
- **Scalability**: Microservices architecture

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Microservices  │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐  ┌──────▼──────┐
                │   MongoDB   │  │    Redis    │
                │             │  │             │
                └─────────────┘  └─────────────┘
                                │
                       ┌────────▼────────┐
                       │  Elasticsearch  │
                       │                 │
                       └─────────────────┘
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Admin registration
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile
- `GET /api/auth/admin-only` - Protected route

### Courses
- `GET /api/courses` - List courses with pagination
- `POST /api/courses/upload` - Upload CSV file
- `GET /api/courses/search` - Search courses
- `GET /api/courses/stats/overview` - Get statistics

### AI Recommendations
- `POST /api/recommendations` - Get AI recommendations
- `GET /api/recommendations/trending` - Trending courses
- `POST /api/recommendations/learning-path` - Learning path

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database
- **Redis** - Caching layer
- **Elasticsearch** - Search engine
- **JWT** - Authentication
- **Docker** - Containerization

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Radix UI** - Component library

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **GitHub Actions** - CI/CD
- **PM2** - Process management
- **Nginx** - Reverse proxy

## 📖 Documentation

- [Setup Instructions](SETUP_INSTRUCTIONS.md)
- [DevOps Guide](backend/DEVOPS.md)
- [Frontend Implementation](sampleuniproject-waygood-sampleuniproject/FRONTEND_IMPLEMENTATION.md)
- [Assessment Summary](ASSESSMENT_SUMMARY.md)

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test-services
```

### Frontend Testing
```bash
cd sampleuniproject-waygood-sampleuniproject
npm run dev
# Open http://localhost:3000
```

## 🚀 Deployment

### Docker Deployment
```bash
cd backend
docker-compose up -d
```

### Manual Deployment
```bash
# Backend
cd backend
npm run start-all

# Frontend
cd sampleuniproject-waygood-sampleuniproject
npm run build
npm start
```

## 📊 Assessment Requirements

This project fulfills all MERN Full-Stack Technical Assessment requirements:

### ✅ Part 1: Backend & Microservices
- User Authentication Microservice with JWT
- Gemini AI Course Recommendation Microservice
- Course Management Microservice with search and caching

### ✅ Part 2: DevOps
- CI/CD Pipeline design
- Docker containerization
- Linux hosting considerations
- Kafka integration concepts

### ✅ Part 3: Frontend
- API integration with all backend services
- State management with React Context
- Client-side caching implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created as part of MERN Full-Stack Technical Assessment.

---

**Ready for GitHub submission!** 🎉