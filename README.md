# DevPulse API

RESTful backend service for developer task, milestone, and activity tracking. Built with Node.js, Express, MongoDB, and Mongoose.

## Overview

DevPulse API is the backend service powering the DevPulse developer platform. It provides endpoints for user authentication, role-based authorization, task lifecycle management, roadmap milestones, and activity audit logs.

## Features

- **Authentication & RBAC**: JWT Bearer token authentication with role-based access control (`developer`, `lead`, `admin`).
- **Password Security**: Bcrypt hashing using Mongoose pre-save middleware.
- **Task Management**: CRUD operations with category tagging, priority levels, and creator scoping.
- **Milestones**: Roadmap milestones with target task associations and dynamic progress calculation.
- **Activity Audit Trail**: Event logging for developer actions with 24-hour velocity metrics.
- **Velocity Analytics**: Comprehensive engineering metrics, cycle times, priority distribution, and 7-day velocity sparkline.
- **Data Export & Backups**: Single-click JSON workspace snapshots and formatted CSV tasks export.
- **Security & Observability**: HTTP security headers, request tracing (`X-Request-Id`, `X-Response-Time`), and in-memory rate limiting.
- **Data Validation**: Request payload validation for formats, lengths, and schema enums.
- **Error Handling**: Centralized error middleware handling validation errors, cast errors, duplicate keys, and JWT failures.
- **In-Memory Fallback**: Standalone fallback mode allowing execution without an active MongoDB connection.
- **Automated Testing**: 57 unit and integration tests covering auth, tasks, milestones, activity, velocity analytics, data exports, and middleware.
- **Docker Ready**: Multi-stage container build with health checks and non-root execution.

## Architecture

```
devpulse-api/
├── Dockerfile                    # Multi-stage production container definition
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection manager
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile management
│   │   ├── taskController.js     # Task CRUD and aggregate stats
│   │   ├── milestoneController.js# Milestone management and progress calculation
│   │   ├── activityController.js # Activity event logging and metrics
│   │   ├── analyticsController.js# Velocity metrics, cycle times, sparkline
│   │   └── exportController.js   # JSON backup and CSV export engine
│   ├── middleware/
│   │   ├── auth.js               # JWT verification and RBAC checks
│   │   ├── errorHandler.js       # Centralized error handler
│   │   ├── rateLimiter.js        # Sliding-window rate limiter
│   │   ├── requestTracer.js      # X-Request-Id & X-Response-Time
│   │   └── validate.js           # Request payload validators
│   ├── models/
│   │   ├── Task.js               # Task schema and lifecycle hooks
│   │   ├── User.js               # User schema and auth methods
│   │   ├── Milestone.js          # Milestone schema and progress logic
│   │   └── Activity.js           # Activity log schema
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── taskRoutes.js         # /api/tasks routes
│   │   ├── milestoneRoutes.js    # /api/milestones routes
│   │   ├── activityRoutes.js     # /api/activity routes
│   │   ├── analyticsRoutes.js    # /api/analytics routes
│   │   └── exportRoutes.js       # /api/export routes
│   └── server.js                 # Express server configuration
├── tests/
│   ├── auth.test.js              # Auth & RBAC test suite (21 tests)
│   ├── task.test.js              # Task validation & controller tests (8 tests)
│   ├── milestone.test.js         # Milestone CRUD & progress tests (13 tests)
│   ├── activity.test.js          # Activity logging tests (5 tests)
│   ├── analytics.test.js         # Engineering velocity tests (3 tests)
│   ├── export.test.js            # JSON backup & CSV export tests (3 tests)
│   └── middleware.test.js        # Request tracing & rate limiter tests (4 tests)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (optional for local development, in-memory fallback is supported)

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode (nodemon)
npm run dev

# Production
npm start
```

### Running Tests

```bash
npm test
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devpulse
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

## API Reference

### Health Check
- `GET /api/health` — Service health status and uptime

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Current user profile (requires auth)
- `PATCH /api/auth/profile` — Update profile details (requires auth)
- `PATCH /api/auth/password` — Change password (requires auth)

### Tasks
- `GET /api/tasks` — List tasks with filtering (`status`, `category`, `priority`, `q`, `page`, `limit`)
- `GET /api/tasks/my` — Tasks created by authenticated user
- `GET /api/tasks/stats` — Task counts and completion metrics
- `GET /api/tasks/:id` — Get single task
- `POST /api/tasks` — Create task
- `PATCH /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task

### Milestones
- `GET /api/milestones` — List milestones
- `GET /api/milestones/stats` — Milestone summary metrics
- `GET /api/milestones/:id` — Get milestone details
- `POST /api/milestones` — Create milestone
- `PATCH /api/milestones/:id` — Update milestone (requires auth)
- `DELETE /api/milestones/:id` — Remove milestone (requires auth)

### Activity
- `GET /api/activity` — Recent activity feed
- `GET /api/activity/summary` — Activity velocity and action counts

### Velocity Analytics
- `GET /api/analytics/velocity` — Complete engineering velocity, cycle times, priority/category distributions, and 7-day sparkline

### Data Export & Backups
- `GET /api/export/backup` — Download complete workspace state as formatted JSON
- `GET /api/export/tasks/csv` — Download task backlog as RFC 4180-compliant CSV
