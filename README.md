# DevPulse API 🚀

A modern developer activity, project milestone, and task tracker API built with the **MERN** stack (Node.js, Express, MongoDB, Mongoose).

## Features
- 📊 **Task Management**: Full CRUD operations for tasks with categories, priorities, and status tracking.
- 🎯 **Milestone & Velocity Stats**: Real-time aggregation of task metrics, completion rates, and status distributions (`/api/tasks/stats`).
- 🛡️ **Validation Middleware**: Strict schema & input validation for fields, categories, and enum constraints.
- 🔌 **Mongoose Integration**: Robust schema with auto-timestamping and automated `completedAt` lifecycle hooks.
- ⚡ **Offline Resilient**: Seamless in-memory fallback mode when running without a MongoDB daemon.
- 🧪 **Automated Test Suite**: Built-in test runner coverage for validation middleware and API controllers.

---

## Architecture
```
devpulse-api/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB / Mongoose connection manager
│   ├── controllers/
│   │   └── taskController.js  # Task business logic & aggregations
│   ├── middleware/
│   │   ├── errorHandler.js    # Centralized JSON error response handler
│   │   └── validate.js        # Request payload & ID validation
│   ├── models/
│   │   └── Task.js            # Mongoose schema with pre-save hooks
│   ├── routes/
│   │   └── taskRoutes.js      # REST endpoint definitions
│   └── server.js              # Express app bootstrap
├── tests/
│   └── task.test.js           # Automated unit test suite
└── package.json
```

---

## Quick Start
```bash
npm install
npm test       # Run automated unit tests
npm run dev    # Start dev server with nodemon
```

## Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devpulse
```

---

## API Reference

### Health
- `GET /api/health` — Check server status & uptime

### Tasks
- `GET /api/tasks` — List tasks (Supports `?status=`, `?category=`, `?priority=`, `?q=`, `?page=`, `?limit=`)
- `GET /api/tasks/stats` — Summary analytics & completion rate
- `GET /api/tasks/:id` — Get single task details
- `POST /api/tasks` — Create new task
- `PATCH /api/tasks/:id` — Update task fields or change status
- `DELETE /api/tasks/:id` — Delete task

### Categories & Priorities
- **Categories**: `Dev`, `Backend`, `Frontend`, `DevOps`, `Architecture`, `Testing`, `General`
- **Statuses**: `pending`, `in-progress`, `completed`
- **Priorities**: `low`, `medium`, `high`, `urgent`
