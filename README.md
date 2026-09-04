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

- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide React.
- **Backend**: Node.js, Express.js, Mongoose (MongoDB), JSON Web Tokens (JWT), Bcrypt.js, Morgan, Express Rate Limit.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a remote MongoDB Atlas URI.

### Local Environment Setup

Create `.env` in the root directory (or copy from `.env.example`):

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
npm run seed  # Seeds initial users, tasks, projects, and teams into MongoDB
npm run dev   # Starts Express API server on http://localhost:3001
```

### Frontend Installation & Startup

```bash
cd frontend
npm install
npm run dev   # Starts Vite React dev server on http://localhost:5173
```

To build the frontend for production:

```bash
cd frontend
npm run build
```

---

## Render Deployment Options

### Deployment Strategy Overview

The application supports two Render deployment configurations:

1. **Option 1: Single Full-Stack Web Service (Simplest)**:
   - Deploy a single Node Web Service on Render with **Root Directory**: `backend`.
   - **Build Command**: `npm install && npm run build` (This runs `cd ../frontend && npm install && npm run build` to build the React static bundle).
   - **Start Command**: `npm start`
   - Express serves the React UI statically from `../frontend/dist` and handles SPA routing fallback for requests to `/`, `/dashboard`, `/tasks`, `/projects`, etc.

2. **Option 2: Separate Web Service (Backend) + Static Site (Frontend)**:
   - **Backend Web Service**: Root Directory `backend`, Build Command `npm install`, Start Command `npm start`.
   - **Frontend Static Site**:
     - **Repository**: `sania28/Task-Management`
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Environment Variable**: `VITE_API_URL=https://<your-backend-service>.onrender.com/api`
     - **Redirects / Rewrites**: Source `/*`, Destination `/index.html`, Action `Rewrite`.

---

## API Endpoint Reference

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
