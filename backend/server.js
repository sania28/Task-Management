const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { hashPassword, verifyPassword, issueToken, verifyToken } = require('./auth');
const db = require('./db');

const PORT = process.env.PORT || 3001;
const STATIC_DIR = path.join(__dirname, '..', 'frontend');

// ---- real-time: Server-Sent Events ----
// (SSE instead of WebSockets: same "push updates without polling" result for this
// app's one-directional server->client updates, using only plain HTTP — no 'ws' or
// 'socket.io' dependency required.)
const sseClientsByUser = new Map(); // userId -> Set(res)

function broadcastToUser(userId, event, payload) {
  const clients = sseClientsByUser.get(userId);
  if (!clients) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) res.write(data);
}

// ---- helpers ----

function sendJSON(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    req.on('data', c => {
      chunks += c;
      if (chunks.length > 1e6) req.destroy(); // 1MB guard
    });
    req.on('end', () => {
      if (!chunks) return resolve({});
      try { resolve(JSON.parse(chunks)); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req, queryToken) {
  const header = req.headers['authorization'] || '';
  // EventSource (used for the live-updates stream) can't set custom headers,
  // so that one route also accepts the token as a query param.
  const token = header.startsWith('Bearer ') ? header.slice(7) : (queryToken || null);
  const payload = verifyToken(token);
  return payload; // { id, email, name, exp } or null
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(STATIC_DIR, filePath);
  if (!filePath.startsWith(STATIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // fall back to index.html for client-side routing
      fs.readFile(path.join(STATIC_DIR, 'index.html'), (err2, indexContent) => {
        if (err2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexContent);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---- request handler ----

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const { pathname, query } = parsed;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  if (!pathname.startsWith('/api/')) {
    return serveStatic(req, res, pathname);
  }

  try {
    // ---- auth routes ----
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { email, password, name } = await readBody(req);
      if (!email || !password || password.length < 6) {
        return sendJSON(res, 400, { error: 'Email and a password of at least 6 characters are required.' });
      }
      if (db.findUserByEmail(email)) {
        return sendJSON(res, 409, { error: 'An account with that email already exists.' });
      }
      const user = db.createUser({ email, name: name || email.split('@')[0], passwordHash: hashPassword(password) });
      const token = issueToken({ id: user.id, email: user.email, name: user.name });
      return sendJSON(res, 201, { token, user: { id: user.id, email: user.email, name: user.name } });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = await readBody(req);
      const user = db.findUserByEmail(email || '');
      if (!user || !verifyPassword(password || '', user.passwordHash)) {
        return sendJSON(res, 401, { error: 'Incorrect email or password.' });
      }
      const token = issueToken({ id: user.id, email: user.email, name: user.name });
      return sendJSON(res, 200, { token, user: { id: user.id, email: user.email, name: user.name } });
    }

    // ---- everything below requires auth ----
    const authUser = getAuthUser(req, query.token);
    if (!authUser) return sendJSON(res, 401, { error: 'Missing or invalid authentication token.' });

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      return sendJSON(res, 200, { user: { id: authUser.id, email: authUser.email, name: authUser.name } });
    }

    // ---- real-time stream ----
    if (pathname === '/api/tasks/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('event: connected\ndata: {}\n\n');
      if (!sseClientsByUser.has(authUser.id)) sseClientsByUser.set(authUser.id, new Set());
      sseClientsByUser.get(authUser.id).add(res);
      const keepAlive = setInterval(() => res.write(':\n\n'), 25000);
      req.on('close', () => {
        clearInterval(keepAlive);
        sseClientsByUser.get(authUser.id)?.delete(res);
      });
      return;
    }

    // ---- task CRUD ----
    if (pathname === '/api/tasks' && req.method === 'GET') {
      const list = db.listTasksForUser(authUser.id, { status: query.status, q: query.q });
      return sendJSON(res, 200, { tasks: list });
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
      const { title, description, priority, dueDate } = await readBody(req);
      if (!title || !title.trim()) return sendJSON(res, 400, { error: 'Title is required.' });
      const task = db.createTask({ userId: authUser.id, title: title.trim(), description, priority, dueDate });
      broadcastToUser(authUser.id, 'task:created', task);
      return sendJSON(res, 201, { task });
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (taskMatch && req.method === 'PUT') {
      const id = Number(taskMatch[1]);
      const patch = await readBody(req);
      const allowed = ['title', 'description', 'status', 'priority', 'dueDate'];
      const cleanPatch = {};
      for (const key of allowed) if (key in patch) cleanPatch[key] = patch[key];
      const task = db.updateTask(id, authUser.id, cleanPatch);
      if (!task) return sendJSON(res, 404, { error: 'Task not found.' });
      broadcastToUser(authUser.id, 'task:updated', task);
      return sendJSON(res, 200, { task });
    }

    if (taskMatch && req.method === 'DELETE') {
      const id = Number(taskMatch[1]);
      const ok = db.deleteTask(id, authUser.id);
      if (!ok) return sendJSON(res, 404, { error: 'Task not found.' });
      broadcastToUser(authUser.id, 'task:deleted', { id });
      return sendJSON(res, 200, { ok: true });
    }

    return sendJSON(res, 404, { error: 'Not found.' });
  } catch (err) {
    console.error(err);
    return sendJSON(res, 400, { error: err.message || 'Something went wrong.' });
  }
});

server.listen(PORT, () => {
  console.log(`Task manager API + frontend running at http://localhost:${PORT}`);
});
