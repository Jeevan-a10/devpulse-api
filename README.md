# DevPulse API 🚀

A robust developer activity, project milestone, and task tracker API built with the **MERN** stack (Node.js, Express, MongoDB, Mongoose) featuring JWT authentication, role-based access control (RBAC), milestone tracking, real-time activity streams, and 47 automated tests.

## Features
- 🔐 **JWT Authentication & RBAC**: Secure registration, login, profile management, and role-based permissions (`developer`, `lead`, `admin`).
- 🛡️ **Bcrypt Password Security & Headers**: Automated password hashing with pre-save Mongoose hooks + HTTP security headers (`nosniff`, `frame-deny`, `xss-protection`).
- 📊 **Task Management & User Scoping**: Full CRUD operations with user association (`/api/tasks`, `/api/tasks/my`).
- 🎯 **Milestone Engine**: Project roadmap milestones with completion progress, due dates, and linked target tasks (`/api/milestones`, `/api/milestones/stats`).
- ⚡ **Developer Activity Stream**: Real-time chronological audit trail of all developer actions and velocity analytics (`/api/activity`, `/api/activity/summary`).
- 📈 **Velocity Stats**: Real-time aggregation of task metrics, completion rates, and status distributions (`/api/tasks/stats`).
- 🛡️ **Validation Middleware**: Strict schema & input validation for fields, categories, and enum constraints.
- 🔌 **Mongoose Integration**: Robust schema with auto-timestamping and automated `completedAt` lifecycle hooks.
- ⚡ **Offline Resilient**: Seamless in-memory fallback mode for zero-database development and testing.
- 🧪 **Comprehensive Automated Testing**: 47 unit and integration tests using Node.js native test runner.

---

## Architecture
```
devpulse-api/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB / Mongoose connection manager
│   ├── controllers/
│   │   ├── authController.js     # User auth, JWT issuance, profile management
│   │   ├── taskController.js     # Task business logic & aggregations
│   │   ├── milestoneController.js# Milestones CRUD & progress calculation
│   │   └── activityController.js # Activity feed logger & velocity metrics
│   ├── middleware/
│   │   ├── auth.js               # JWT verification (`protect`), optional auth & RBAC (`authorize`)
│   │   ├── errorHandler.js       # Centralized JSON error response handler (JWT, Mongoose, Cast)
│   │   └── validate.js           # Request payload & ID validation (auth, tasks, milestones)
│   ├── models/
│   │   ├── Task.js               # Mongoose schema with pre-save hooks & user reference
│   │   ├── User.js               # User schema with bcrypt hashing & JWT methods
│   │   ├── Milestone.js          # Milestone schema with progress and targetTasks
│   │   └── Activity.js           # Activity log schema for audit trail
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication & user profile endpoints
│   │   ├── taskRoutes.js         # REST task & stats endpoints
│   │   ├── milestoneRoutes.js    # Milestones and milestone metrics
│   │   └── activityRoutes.js     # Activity feed & summary endpoints
│   └── server.js                 # Express app bootstrap & security headers
├── tests/
│   ├── auth.test.js              # Auth, RBAC, profile, and security tests (21 tests)
│   ├── task.test.js              # Task validation and controller tests (8 tests)
│   ├── milestone.test.js         # Milestones CRUD and stats tests (13 tests)
│   └── activity.test.js          # Activity stream and velocity tests (5 tests)
└── package.json
```

---

## Quick Start
```bash
npm install
npm test       # Run automated unit tests (47 passing tests)
npm run dev    # Start dev server with nodemon
```

## Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devpulse
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

---

## API Reference

### Health
- `GET /api/health` — Check server status & uptime

### Authentication & Users
- `POST /api/auth/register` — Register a new user (`name`, `email`, `password`, optional `role`, `bio`)
- `POST /api/auth/login` — Authenticate user and receive JWT bearer token
- `GET /api/auth/me` — Get current authenticated user profile (`Authorization: Bearer <token>`)
- `PATCH /api/auth/profile` — Update user profile details (`name`, `bio`, `avatar`)
- `PATCH /api/auth/password` — Change password (`currentPassword`, `newPassword`)

### Tasks
- `GET /api/tasks` — List tasks (Supports `?status=`, `?category=`, `?priority=`, `?q=`, `?page=`, `?limit=`)
- `GET /api/tasks/my` — List tasks created by or assigned to the authenticated user (`Authorization: Bearer <token>`)
- `GET /api/tasks/stats` — Summary analytics & completion rate
- `GET /api/tasks/:id` — Get single task details
- `POST /api/tasks` — Create new task (associates creator if authenticated)
- `PATCH /api/tasks/:id` — Update task fields or change status
- `DELETE /api/tasks/:id` — Delete task

### Milestones
- `GET /api/milestones` — List milestones (Supports `?status=`)
- `GET /api/milestones/stats` — Milestone analytics (total, completed, in-progress, planning, average progress)
- `GET /api/milestones/:id` — Get milestone details
- `POST /api/milestones` — Create milestone (`title`, `description`, `status`, `dueDate`, `progress`)
- `PATCH /api/milestones/:id` — Update milestone (`protect` required)
- `DELETE /api/milestones/:id` — Remove milestone (`protect` required)

### Activity Stream
- `GET /api/activity` — Chronological feed of developer activities (Supports `?limit=`, `?action=`, `?entityType=`)
- `GET /api/activity/summary` — Velocity analytics (actions in last 24h, active contributors, velocity rating)

### Allowed Values
- **Roles**: `developer`, `lead`, `admin`
- **Task Categories**: `Dev`, `Backend`, `Frontend`, `DevOps`, `Architecture`, `Testing`, `General`
- **Task Statuses**: `pending`, `in-progress`, `completed`
- **Milestone Statuses**: `planning`, `in-progress`, `completed`
- **Priorities**: `low`, `medium`, `high`, `urgent`
