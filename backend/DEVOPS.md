# DevOps Implementation Guide

## Part 2a: CI/CD Pipeline Sketch

### Pipeline Stages

#### 1. Code Commit
- **Trigger**: Push to main/develop branches
- **Tools**: Git hooks, GitHub webhooks
- **Actions**: 
  - Code quality checks
  - Security scanning
  - Dependency vulnerability checks

#### 2. Build Stage
- **Tools**: GitHub Actions, Docker Buildx
- **Actions**:
  - Build Docker images for each microservice
  - Run unit tests
  - Generate build artifacts
  - Push images to container registry

#### 3. Test Stage
- **Tools**: Jest, Supertest, Docker Compose
- **Actions**:
  - Unit tests for each service
  - Integration tests
  - API endpoint testing
  - Database migration tests

#### 4. Deploy Stage
- **Tools**: Docker Swarm, Kubernetes, or PM2
- **Actions**:
  - Deploy to staging environment
  - Run smoke tests
  - Deploy to production (manual approval)
  - Health checks and monitoring

### Microservices Management

```yaml
# Example GitHub Actions workflow
name: MERN Stack CI/CD
on:
  push:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, courses, ai, gateway]
    steps:
      - uses: actions/checkout@v3
      - name: Build ${{ matrix.service }} service
        run: docker build -f Dockerfile.${{ matrix.service }} -t ${{ matrix.service }}:latest .
      - name: Test ${{ matrix.service }} service
        run: docker run --rm ${{ matrix.service }}:latest npm test
      - name: Push to registry
        run: docker push registry.com/${{ matrix.service }}:latest
```

## Part 2b: Dockerization

### Dockerfile for Authentication Microservice

```dockerfile
# Multi-stage build for Auth Service
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Set ownership
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the auth service
CMD ["node", "services/auth/server.js"]
```

### Build and Run Instructions

```bash
# Build the Docker image
docker build -f Dockerfile.auth -t course-auth-service:latest .

# Run the container
docker run -d \
  --name auth-service \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/course_management_system \
  -e JWT_SECRET=your_jwt_secret \
  course-auth-service:latest

# Check container status
docker ps
docker logs auth-service

# Stop and remove container
docker stop auth-service
docker rm auth-service
```

## Part 2c: Linux Hosting Considerations

### Process Management
- **PM2**: Process manager for Node.js applications
- **Systemd**: Service management for production environments
- **Docker**: Container orchestration

### Reverse Proxy
- **Nginx**: Load balancing and SSL termination
- **HAProxy**: High availability load balancer

### Environment Variables
```bash
# Production environment setup
export NODE_ENV=production
export MONGODB_URI=mongodb://prod-cluster:27017/course_management_system
export REDIS_URL=redis://prod-redis:6379
export JWT_SECRET=super_secure_production_secret
```

### Multi-Service Management

#### Option 1: Single Server with PM2
```bash
# Install PM2
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# Restart services
pm2 restart all
```

#### Option 2: Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml course-management

# Scale services
docker service scale course-management_auth-service=3
```

#### Option 3: Kubernetes
```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: course-auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb-service:27017/course_management_system"
```

## Part 2d: Apache Kafka Usage

### Event-Driven Architecture

#### 1. User Authentication Events
```javascript
// When user logs in
const loginEvent = {
  eventType: 'USER_LOGIN',
  userId: admin._id,
  timestamp: new Date(),
  metadata: {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }
};

// Publish to Kafka
await kafkaProducer.send({
  topic: 'user-events',
  messages: [{ value: JSON.stringify(loginEvent) }]
});
```

#### 2. Course Data Streaming
```javascript
// When course is uploaded
const courseEvent = {
  eventType: 'COURSE_UPLOADED',
  courseId: course._id,
  courseData: course,
  timestamp: new Date(),
  adminId: req.admin.id
};

// Publish to Kafka
await kafkaProducer.send({
  topic: 'course-events',
  messages: [{ value: JSON.stringify(courseEvent) }]
});

// Other services can subscribe to process the event
// - Update search index
// - Send notifications
// - Generate analytics
```

### Benefits of Kafka in This Architecture

1. **Asynchronous Processing**: Course uploads don't block the API response
2. **Event Sourcing**: Complete audit trail of all system events
3. **Microservice Decoupling**: Services communicate through events
4. **Scalability**: Handle high-volume course uploads
5. **Reliability**: Message persistence and replay capabilities

### Kafka Topics Structure
```
user-events: Authentication and user management events
course-events: Course CRUD operations
search-events: Search query analytics
recommendation-events: AI recommendation requests
audit-events: System audit and compliance
```

### Implementation Example
```javascript
// Kafka producer setup
const { Kafka } = require('kafkajs');

const kafka = Kafka({
  clientId: 'course-management-service',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
});

const producer = kafka.producer();

// In course upload endpoint
app.post('/api/courses/upload', async (req, res) => {
  try {
    // Process CSV upload
    const courses = await processCSVUpload(req.file);
    
    // Publish event for each course
    for (const course of courses) {
      await producer.send({
        topic: 'course-events',
        messages: [{
          key: course.course_id,
          value: JSON.stringify({
            eventType: 'COURSE_CREATED',
            course: course,
            timestamp: new Date()
          })
        }]
      });
    }
    
    res.json({ success: true, courses: courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

This Kafka implementation provides:
- **Event-driven architecture** for better scalability
- **Audit trail** for compliance and debugging
- **Asynchronous processing** for better performance
- **Service decoupling** for easier maintenance