# DevPulse API 🚀

A modern developer activity, project milestone, and task tracker API built with the **MERN** stack (Node.js, Express, MongoDB).

## Features
- 📊 Track daily development tasks and completion status.
- 🎯 Milestone tracking with automatic velocity calculation.
- 🏷️ Categorization by stack and priority.
- 🔌 Clean modular REST API structure.

## Quick Start
```bash
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devpulse
```

## API Endpoints
- `GET /api/health` - Server health status
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update task status
- `DELETE /api/tasks/:id` - Delete a task
