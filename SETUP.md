# Setup & Run Guide

## Prerequisites
- Node.js 18+
- MongoDB (local) at mongodb://localhost:27017
- Optional: Redis (localhost:6379) for caching
- Optional: Elasticsearch (http://localhost:9200) for search
- Windows PowerShell or a Unix-like shell

## 1) Environment Files
Create these files:
- backend/.env
- sampleuniproject-waygood-sampleuniproject/.env.local

Use the sample contents provided in this repository.

## 2) Install Dependencies
Open two terminals.

Terminal A (backend):
`
cd backend
npm install
`

Terminal B (frontend):
`
cd sampleuniproject-waygood-sampleuniproject
npm install
`

## 3) Start Services (Local Dev)
Option A - start all Node services:
`
# Terminal A
cd backend
npm run start-all
`

Option B - Docker (brings up MongoDB, Redis, Elasticsearch, and services):
`
# Terminal A
cd backend
docker-compose up -d
`

Frontend:
`
# Terminal B
cd sampleuniproject-waygood-sampleuniproject
npm run dev
`

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001/health
- Courses Service: http://localhost:3002/health
- AI Service: http://localhost:3003/health

## 4) Test the Backend Quickly
From backend terminal:
`
npm run test-services
`
This checks health, auth flow, courses API, and AI endpoints.

## 5) Admin Login & CSV Upload
- Go to http://localhost:3000/admin/login
- Sign up via API (POST /api/auth/signup) if needed
- After login, visit Admin Dashboard (http://localhost:3000/admin/dashboard)
- Upload a CSV at "Courses" (sample at ackend/sample-data/sample-courses.csv)

## 6) Search & AI
- Course list/search: GET /api/courses and GET /api/courses/search?q=...
- AI recommendations page: http://localhost:3000/course-match

## Scripts Reference

Backend (backend/package.json):
- 
pm run start-all: start Auth, Courses, AI, and API Gateway
- 
pm run test-services: run HTTP tests against all services
- Individual (dev) services:
  - 
pm run auth-service
  - 
pm run course-service
  - 
pm run ai-service
  - 
pm run dev (API Gateway)

Frontend (sampleuniproject-waygood-sampleuniproject/package.json):
- 
pm run dev: start Next.js app (port 3000)
- 
pm run build: build Next.js
- 
pm start: start built app
- 
pm run typecheck: TypeScript check

## Notes
- Redis and Elasticsearch are optional. If not running, the code gracefully skips caching/search indexing (basic features still work).
- The AI service uses a mocked Gemini call by default; add your API key in backend/.env to integrate a real call.

## Troubleshooting
- Ports in use: change ports in ackend/.env.
- Auth issues: ensure JWT_SECRET is set.
- CORS: frontend should use NEXT_PUBLIC_API_URL=http://localhost:3000.
