import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');
if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, '[]');
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');
if (!fs.existsSync(NOTIFICATIONS_FILE)) fs.writeFileSync(NOTIFICATIONS_FILE, '[]');
if (!fs.existsSync(TEAMS_FILE)) fs.writeFileSync(TEAMS_FILE, '[]');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeJSON(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let users = readJSON(USERS_FILE);
let tasks = readJSON(TASKS_FILE);
let projects = readJSON(PROJECTS_FILE);
let messages = readJSON(MESSAGES_FILE);
let notifications = readJSON(NOTIFICATIONS_FILE);
let teams = readJSON(TEAMS_FILE);

function saveUsers() { writeJSON(USERS_FILE, users); }
function saveTasks() { writeJSON(TASKS_FILE, tasks); }
function saveProjects() { writeJSON(PROJECTS_FILE, projects); }
function saveMessages() { writeJSON(MESSAGES_FILE, messages); }
function saveNotifications() { writeJSON(NOTIFICATIONS_FILE, notifications); }
function saveTeams() { writeJSON(TEAMS_FILE, teams); }

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const db = {
  // Users
  findUserByEmail(email) {
    if (!email) return null;
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id) {
    const user = users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return { ...safeUser, id: user._id || user.id };
  },
  findUserByIdWithPassword(id) {
    return users.find((u) => u._id === id || u.id === id);
  },
  createUser({ name, email, password, role = 'member', avatar = null, bio = '', department = '' }) {
    const id = generateId();
    const user = {
      _id: id,
      id,
      name,
      email: email.toLowerCase(),
      password,
      role,
      avatar,
      status: 'active',
      bio,
      department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers();
    return db.findUserById(id);
  },
  updateUser(id, patch) {
    const user = users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    Object.assign(user, patch, { updatedAt: new Date().toISOString() });
    saveUsers();
    return db.findUserById(id);
  },
  listUsers({ search, role, status } = {}) {
    let result = [...users];
    if (role) result = result.filter((u) => u.role === role);
    if (status) result = result.filter((u) => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return result.map((u) => db.findUserById(u._id));
  },

  // Tasks
  listTasks({ userId, status, priority, projectId, assigneeId, search } = {}) {
    let result = [...tasks];
    if (userId) {
      result = result.filter((t) => t.creator === userId || t.assignee === userId);
    }
    if (status) result = result.filter((t) => t.status === status);
    if (priority) result = result.filter((t) => t.priority === priority);
    if (projectId) result = result.filter((t) => t.project === projectId);
    if (assigneeId) result = result.filter((t) => t.assignee === assigneeId);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      );
    }

    return result.map((task) => db.populateTask(task));
  },
  populateTask(task) {
    if (!task) return null;
    const assignee = task.assignee ? db.findUserById(task.assignee) : null;
    const creator = task.creator ? db.findUserById(task.creator) : null;
    const projectObj = task.project ? projects.find((p) => p._id === task.project || p.id === task.project) : null;
    const project = projectObj ? { _id: projectObj._id, id: projectObj._id, name: projectObj.name } : null;

    const populatedComments = (task.comments || []).map((c) => ({
      ...c,
      user: db.findUserById(c.user),
    }));

    return {
      ...task,
      assignee,
      creator,
      project,
      comments: populatedComments,
    };
  },
  getTaskById(id) {
    const task = tasks.find((t) => t._id === id || t.id === id);
    return task ? db.populateTask(task) : null;
  },
  createTask({ title, description, priority, dueDate, creator, assignee, project }) {
    const id = generateId();
    const task = {
      _id: id,
      id,
      title,
      description: description || '',
      status: 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      creator,
      assignee: assignee || null,
      project: project || null,
      comments: [],
      isOverdue: false,
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    saveTasks();
    return db.populateTask(task);
  },
  updateTask(id, patch) {
    const task = tasks.find((t) => t._id === id || t.id === id);
    if (!task) return null;
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    if (task.dueDate && task.status !== 'completed') {
      task.isOverdue = new Date(task.dueDate) < new Date();
    } else {
      task.isOverdue = false;
    }
    saveTasks();
    return db.populateTask(task);
  },
  deleteTask(id) {
    const idx = tasks.findIndex((t) => t._id === id || t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    saveTasks();
    return true;
  },
  addCommentToTask(taskId, { userId, text }) {
    const task = tasks.find((t) => t._id === taskId || t.id === taskId);
    if (!task) return null;
    if (!task.comments) task.comments = [];
    const comment = {
      _id: generateId(),
      user: userId,
      text,
      createdAt: new Date().toISOString(),
    };
    task.comments.push(comment);
    saveTasks();
    return (task.comments || []).map((c) => ({
      ...c,
      user: db.findUserById(c.user),
    }));
  },

  // Projects
  listProjects({ userId, status, search } = {}) {
    let result = [...projects];
    if (userId) {
      result = result.filter(
        (p) => p.owner === userId || (p.teamMembers || []).includes(userId)
      );
    }
    if (status) result = result.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }

    return result.map((p) => db.populateProject(p));
  },
  populateProject(project) {
    if (!project) return null;
    const owner = db.findUserById(project.owner);
    const teamMembers = (project.teamMembers || []).map((id) => db.findUserById(id)).filter(Boolean);
    const projectTasks = tasks
      .filter((t) => t.project === project._id)
      .map((t) => db.populateTask(t));

    return {
      ...project,
      owner,
      teamMembers,
      tasks: projectTasks,
    };
  },
  getProjectById(id) {
    const project = projects.find((p) => p._id === id || p.id === id);
    return project ? db.populateProject(project) : null;
  },
  createProject({ name, description, startDate, dueDate, owner }) {
    const id = generateId();
    const project = {
      _id: id,
      id,
      name,
      description: description || '',
      status: 'planning',
      progress: 0,
      startDate: startDate || null,
      dueDate: dueDate || null,
      owner,
      teamMembers: [owner],
      completedTasks: 0,
      totalTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);
    saveProjects();
    return db.populateProject(project);
  },
  updateProject(id, patch) {
    const project = projects.find((p) => p._id === id || p.id === id);
    if (!project) return null;
    Object.assign(project, patch, { updatedAt: new Date().toISOString() });
    saveProjects();
    return db.populateProject(project);
  },
  deleteProject(id) {
    const idx = projects.findIndex((p) => p._id === id || p.id === id);
    if (idx === -1) return false;
    projects.splice(idx, 1);
    saveProjects();
    // Cascade delete associated tasks
    tasks = tasks.filter((t) => t.project !== id);
    saveTasks();
    return true;
  },

  // Teams
  listTeams({ userId, search } = {}) {
    let result = [...teams];
    if (userId) {
      result = result.filter(
        (t) =>
          t.owner === userId ||
          (t.members || []).some((m) => m.user === userId || m.user?._id === userId)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result.map((t) => db.populateTeam(t));
  },
  populateTeam(team) {
    if (!team) return null;
    const owner = db.findUserById(team.owner);
    const members = (team.members || []).map((m) => ({
      ...m,
      user: db.findUserById(m.user),
    }));
    return {
      ...team,
      owner,
      members,
    };
  },
  getTeamById(id) {
    const team = teams.find((t) => t._id === id || t.id === id);
    return team ? db.populateTeam(team) : null;
  },
  createTeam({ name, description, owner }) {
    const id = generateId();
    const team = {
      _id: id,
      id,
      name,
      description: description || '',
      owner,
      members: [{ user: owner, role: 'owner', joinedAt: new Date().toISOString() }],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    teams.push(team);
    saveTeams();
    return db.populateTeam(team);
  },
  deleteTeam(id) {
    const idx = teams.findIndex((t) => t._id === id || t.id === id);
    if (idx === -1) return false;
    teams.splice(idx, 1);
    saveTeams();
    return true;
  },

  // Messages
  listMessagesBetween(userId1, userId2) {
    const list = messages.filter(
      (m) =>
        (m.sender === userId1 && m.recipient === userId2) ||
        (m.sender === userId2 && m.recipient === userId1)
    );
    return list.map((m) => ({
      ...m,
      sender: db.findUserById(m.sender),
      recipient: db.findUserById(m.recipient),
    }));
  },
  createMessage({ sender, recipient, content }) {
    const id = generateId();
    const conversationId = [sender, recipient].sort().join('-');
    const msg = {
      _id: id,
      id,
      sender,
      recipient,
      content,
      isRead: false,
      conversationId,
      createdAt: new Date().toISOString(),
    };
    messages.push(msg);
    saveMessages();
    return {
      ...msg,
      sender: db.findUserById(sender),
      recipient: db.findUserById(recipient),
    };
  },

  // Notifications
  listNotifications(userId, { unreadOnly } = {}) {
    let list = notifications.filter((n) => n.user === userId);
    if (unreadOnly) list = list.filter((n) => !n.isRead);
    return list
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((n) => ({
        ...n,
        relatedUser: n.relatedUser ? db.findUserById(n.relatedUser) : null,
      }));
  },
  createNotification({ user, type, title, message, relatedUser, relatedTask, relatedProject }) {
    const id = generateId();
    const notification = {
      _id: id,
      id,
      user,
      type,
      title,
      message,
      relatedUser: relatedUser || null,
      relatedTask: relatedTask || null,
      relatedProject: relatedProject || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    saveNotifications();
    return notification;
  },
  markNotificationRead(id) {
    const n = notifications.find((x) => x._id === id || x.id === id);
    if (!n) return null;
    n.isRead = true;
    saveNotifications();
    return n;
  },
  markAllNotificationsRead(userId) {
    notifications.forEach((n) => {
      if (n.user === userId) n.isRead = true;
    });
    saveNotifications();
    return true;
  },
  clearAll() {
    users = [];
    tasks = [];
    projects = [];
    messages = [];
    notifications = [];
    teams = [];
    saveUsers();
    saveTasks();
    saveProjects();
    saveMessages();
    saveNotifications();
    saveTeams();
  },
};
