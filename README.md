# Dispatch — Full-Stack Task Management Application

A clean, full-stack task management application with a **React** frontend and a **Node.js/Express** REST API backend using **file-based JSON persistent storage** (zero database setup required).

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
- **Backend**: Node.js, Express.js, JSON File Storage, JSON Web Tokens (JWT), Bcrypt.js, Morgan, Express Rate Limit.

## Getting Started

### Prerequisites

- Node.js (v18+)

### Local Environment Setup

Create `.env` in the root directory (or copy from `.env.example`):

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
VITE_API_URL=http://localhost:3001/api
```

### Backend Installation & Startup

```bash
cd backend
npm install
npm run seed  # Seeds initial users, tasks, projects, and teams into backend/data/
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

## Render Deployment Instructions

You can deploy both the Backend Web Service and Frontend Static Site on Render without needing external database services.

### 1. Deploy Backend Web Service on Render

1. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `task-manager-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the required Environment Variables in Render:
   - `JWT_SECRET`: A secure random secret string
   - `JWT_EXPIRE`: `7d`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your deployed frontend URL on Render (e.g. `https://task-manager-frontend.onrender.com`)
5. Deploy the backend service and copy its public URL (e.g. `https://task-manager-backend.onrender.com`).

### 2. Deploy Frontend Static Site on Render

1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `task-manager-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add the required Environment Variable in Render:
   - `VITE_API_URL`: Your backend URL with `/api` appended (e.g. `https://task-manager-backend.onrender.com/api`)
5. Configure Rewrite/Redirect rules under Static Site settings to handle React Router client-side routing:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Deploy the static site.

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
