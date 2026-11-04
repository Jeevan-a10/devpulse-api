# DevPulse API 🚀

A robust developer activity, project milestone, and task tracker API built with the **MERN** stack (Node.js, Express, MongoDB, Mongoose) featuring JWT authentication, role-based access control (RBAC), and automated test suites.

## Features
- 🔐 **JWT Authentication & RBAC**: Secure registration, login, profile management, and role-based permissions (`developer`, `lead`, `admin`).
- 🛡️ **Bcrypt Password Security**: Automated salting and hashing with pre-save Mongoose hooks.
- 📊 **Task Management & User Scoping**: Full CRUD operations with user association (`/api/tasks`, `/api/tasks/my`).
- 🎯 **Milestone & Velocity Stats**: Real-time aggregation of task metrics, completion rates, and status distributions (`/api/tasks/stats`).
- 🛡️ **Validation Middleware**: Strict schema & input validation for fields, categories, and enum constraints.
- 🔌 **Mongoose Integration**: Robust schema with auto-timestamping and automated `completedAt` lifecycle hooks.
- ⚡ **Offline Resilient**: Seamless in-memory fallback mode for zero-database development and testing.
- 🧪 **Comprehensive Automated Testing**: 29 unit and integration tests using Node.js native test runner.

---

## Architecture
```
devpulse-api/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB / Mongoose connection manager
│   ├── controllers/
│   │   ├── authController.js  # User auth, JWT issuance, profile management
│   │   └── taskController.js  # Task business logic & aggregations
│   ├── middleware/
│   │   ├── auth.js            # JWT verification (`protect`), optional auth & RBAC (`authorize`)
│   │   ├── errorHandler.js    # Centralized JSON error response handler (JWT, Mongoose, Cast)
│   │   └── validate.js        # Request payload & ID validation (auth & tasks)
│   ├── models/
│   │   ├── Task.js            # Mongoose schema with pre-save hooks & user reference
│   │   └── User.js            # User schema with bcrypt hashing & JWT methods
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication & user profile endpoints
│   │   └── taskRoutes.js      # REST task & stats endpoints
│   └── server.js              # Express app bootstrap
├── tests/
│   ├── auth.test.js           # Auth, RBAC, profile, and security tests (21 tests)
│   └── task.test.js           # Task validation and controller tests (8 tests)
└── package.json
```

---

## Quick Start
```bash
npm install
npm test       # Run automated unit tests (29 tests)
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

### Categories, Priorities & Roles
- **Roles**: `developer`, `lead`, `admin`
- **Categories**: `Dev`, `Backend`, `Frontend`, `DevOps`, `Architecture`, `Testing`, `General`
- **Statuses**: `pending`, `in-progress`, `completed`
- **Priorities**: `low`, `medium`, `high`, `urgent`
