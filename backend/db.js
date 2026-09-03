const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  // write to a temp file then rename, so a crash mid-write can't corrupt the store
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

let users = readJSON(USERS_FILE);
let tasks = readJSON(TASKS_FILE);

function saveUsers() { writeJSON(USERS_FILE, users); }
function saveTasks() { writeJSON(TASKS_FILE, tasks); }

let userSeq = users.reduce((max, u) => Math.max(max, u.id), 0);
let taskSeq = tasks.reduce((max, t) => Math.max(max, t.id), 0);

module.exports = {
  // users
  findUserByEmail(email) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser({ email, name, passwordHash }) {
    const user = { id: ++userSeq, email, name, passwordHash, createdAt: Date.now() };
    users.push(user);
    saveUsers();
    return user;
  },
  // tasks
  listTasksForUser(userId, { status, q } = {}) {
    let result = tasks.filter(t => t.userId === userId);
    if (status) result = result.filter(t => t.status === status);
    if (q) {
      const needle = q.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(needle) ||
        (t.description || '').toLowerCase().includes(needle)
      );
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  getTask(id, userId) {
    return tasks.find(t => t.id === id && t.userId === userId);
  },
  createTask({ userId, title, description, priority, dueDate }) {
    const now = Date.now();
    const task = {
      id: ++taskSeq,
      userId,
      title,
      description: description || '',
      status: 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    saveTasks();
    return task;
  },
  updateTask(id, userId, patch) {
    const task = tasks.find(t => t.id === id && t.userId === userId);
    if (!task) return null;
    Object.assign(task, patch, { updatedAt: Date.now() });
    saveTasks();
    return task;
  },
  deleteTask(id, userId) {
    const idx = tasks.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    saveTasks();
    return true;
  },
};
