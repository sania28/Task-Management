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

## Render Deployment Instructions

To deploy the application so that the React frontend UI is publicly accessible and communicates with the Node/Express backend:

### 1. Deploy Backend Web Service on Render

1. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your Git repository (`sania28/Task-Management`).
3. Configure the backend settings:
   - **Name**: `task-manager-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables in Render Backend Settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/task-manager`)
   - `JWT_SECRET`: A secure random secret string
   - `JWT_EXPIRE`: `7d`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your deployed frontend Render URL (e.g. `https://task-manager-frontend.onrender.com`)
5. Deploy the backend service and copy its public URL (e.g. `https://task-manager-backend.onrender.com`).

### 2. Deploy Frontend Static Site on Render (Public UI)

1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect your Git repository (`sania28/Task-Management`).
3. Configure the frontend settings:
   - **Name**: `task-manager-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables in Render Frontend Settings:
   - `VITE_API_URL`: Your backend service URL with `/api` (e.g. `https://task-manager-backend.onrender.com/api`)
5. Configure Redirects / Rewrites rule under Static Site settings for React Router:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Deploy the static site and access your public React Task Management UI URL.

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
