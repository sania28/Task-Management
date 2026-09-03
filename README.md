# Dispatch — Full-Stack Task Management Application

A full-stack task management application with a **React** frontend, **Node.js/Express** REST API backend, and **MongoDB** database integration.

## Features

- **User Authentication**: Secure JWT-based sign up, login, profile management, and password change using `bcryptjs`.
- **Dashboard**: Real-time summary statistics for tasks, projects, overdue items, team counts, and task distribution bar charts.
- **Task Management**: Kanban task board with status stages (`To Do`, `In Progress`, `Completed`), priority badges, project association, assignee, and comments.
- **Project Management**: Project overview, status tracking, automatic completion progress calculation, and team member management.
- **Direct Messages**: Real-time polling chat system for direct communication between team members.
- **Team Management**: Organization directory and custom team group management.
- **Notifications**: In-app notifications with unread badge counter for task assignments, project additions, and messages.

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide React, CSS modules.
- **Backend**: Node.js, Express.js, Mongoose (MongoDB), JSON Web Tokens (JWT), Bcrypt.js, Morgan, Express Rate Limit.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017/task-manager` or a remote MongoDB Atlas URI.

### Environment Setup

Create `.env` in the root directory (or use `.env.example` as a template):

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
VITE_API_URL=http://localhost:3001/api
```

### Backend Installation & Startup

```bash
cd backend
npm install
npm run seed  # Populates sample users, tasks, projects, and teams
npm run dev   # Starts Express server on http://localhost:3001
```

### Frontend Installation & Startup

```bash
cd frontend
npm install
npm run dev   # Starts Vite development server on http://localhost:5173
```

To build the frontend for production:

```bash
cd frontend
npm run build
```

## API Endpoint Overview

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user & retrieve JWT
- `GET /api/auth/me` - Fetch authenticated user details
- `GET /api/dashboard` - Fetch dashboard metrics & aggregated stats
- `GET /api/tasks` - List tasks (with status, priority, search filters)
- `POST /api/tasks` - Create a task
- `PUT /api/tasks/:id` - Update task status/fields
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create a project
- `GET /api/messages/:userId` - Get direct message thread
- `POST /api/messages` - Send a message
- `GET /api/teams` - List team groups
- `GET /api/notifications` - Fetch user notifications
