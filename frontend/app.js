(() => {
  const API = ''; // same origin

  const state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    tasks: [],
    filter: 'all',
    search: '',
    editingId: null,
  };

  let eventSource = null;

  // ===== DOM refs =====
  const authScreen = document.getElementById('auth-screen');
  const boardScreen = document.getElementById('board-screen');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const dialog = document.getElementById('task-dialog');
  const taskForm = document.getElementById('task-form');
  const dialogTitle = document.getElementById('dialog-title');
  const deleteBtn = document.getElementById('delete-task-btn');
  const liveIndicator = document.getElementById('live-indicator');

  // ===== API helper =====
  async function api(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Request failed');
    return body;
  }

  // ===== Auth =====
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      loginForm.hidden = !isLogin;
      registerForm.hidden = isLogin;
    });
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.textContent = '';
    const data = Object.fromEntries(new FormData(loginForm));
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
      onAuthed(result);
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    registerError.textContent = '';
    const data = Object.fromEntries(new FormData(registerForm));
    try {
      const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
      onAuthed(result);
    } catch (err) {
      registerError.textContent = err.message;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    state.token = null;
    state.user = null;
    if (eventSource) eventSource.close();
    showAuthScreen();
  });

  function onAuthed({ token, user }) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    showBoardScreen();
  }

  function showAuthScreen() {
    authScreen.hidden = false;
    boardScreen.hidden = true;
  }

  function showBoardScreen() {
    authScreen.hidden = true;
    boardScreen.hidden = false;
    document.getElementById('user-name').textContent = state.user.name || state.user.email;
    loadTasks();
    connectLiveUpdates();
  }

  // ===== Filters & search =====
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      render();
    });
  });

  document.getElementById('search-input').addEventListener('input', e => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });

  // ===== Task loading =====
  async function loadTasks() {
    try {
      const { tasks } = await api('/api/tasks');
      state.tasks = tasks;
      render();
    } catch (err) {
      if (String(err.message).includes('token')) {
        // stale/invalid token — send back to sign in
        document.getElementById('logout-btn').click();
      }
    }
  }

  // ===== Live updates via SSE =====
  function connectLiveUpdates() {
    if (eventSource) eventSource.close();
    // EventSource can't send an Authorization header, so the token is passed as a
    // query param here; the server accepts it only on this one route.
    eventSource = new EventSource(`/api/tasks/stream?token=${encodeURIComponent(state.token)}`);
    eventSource.addEventListener('connected', () => setLive(true));
    eventSource.addEventListener('task:created', e => {
      const task = JSON.parse(e.data);
      upsertTask(task);
    });
    eventSource.addEventListener('task:updated', e => {
      const task = JSON.parse(e.data);
      upsertTask(task);
    });
    eventSource.addEventListener('task:deleted', e => {
      const { id } = JSON.parse(e.data);
      state.tasks = state.tasks.filter(t => t.id !== id);
      render();
    });
    eventSource.onerror = () => setLive(false);
  }

  function setLive(isLive) {
    liveIndicator.classList.toggle('offline', !isLive);
  }

  function upsertTask(task) {
    const idx = state.tasks.findIndex(t => t.id === task.id);
    if (idx === -1) state.tasks.unshift(task);
    else state.tasks[idx] = task;
    render();
  }

  // ===== Rendering =====
  function matchesFilter(task) {
    if (state.search) {
      const hay = `${task.title} ${task.description || ''}`.toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    if (state.filter === 'high') return task.priority === 'high';
    if (state.filter === 'overdue') return isOverdue(task);
    return true;
  }

  function isOverdue(task) {
    return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().toDateString());
  }

  function render() {
    const columns = { todo: [], in_progress: [], done: [] };
    for (const task of state.tasks) {
      if (matchesFilter(task)) columns[task.status]?.push(task);
    }
    for (const status of Object.keys(columns)) {
      const list = document.getElementById(`list-${status}`);
      document.getElementById(`count-${status}`).textContent = columns[status].length;
      list.innerHTML = '';
      if (columns[status].length === 0) {
        list.innerHTML = `<div class="empty-slot">${emptyMessage(status)}</div>`;
        continue;
      }
      for (const task of columns[status]) list.appendChild(renderCard(task));
    }
  }

  function emptyMessage(status) {
    if (status === 'todo') return 'Nothing queued. Add a task to get started.';
    if (status === 'in_progress') return 'Nothing in motion right now.';
    return 'Nothing finished yet.';
  }

  function renderCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.priority = task.priority;

    const due = task.dueDate ? formatDate(task.dueDate) : null;
    const overdue = isOverdue(task);

    card.innerHTML = `
      <div class="title"></div>
      ${task.description ? '<div class="desc"></div>' : ''}
      <div class="meta">
        <span class="priority">${task.priority}</span>
        ${due ? `<span class="due ${overdue ? 'overdue' : ''}">${overdue ? 'overdue ' : 'due '}${due}</span>` : '<span></span>'}
      </div>
      <div class="status-actions">
        <button data-status="todo">To do</button>
        <button data-status="in_progress">Doing</button>
        <button data-status="done">Done</button>
      </div>
    `;
    card.querySelector('.title').textContent = task.title;
    if (task.description) card.querySelector('.desc').textContent = task.description;

    card.querySelectorAll('.status-actions button').forEach(btn => {
      if (btn.dataset.status === task.status) btn.classList.add('active-status');
      btn.addEventListener('click', async ev => {
        ev.stopPropagation();
        const status = btn.dataset.status;
        const { task: updated } = await api(`/api/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        upsertTask(updated);
      });
    });

    card.addEventListener('click', () => openDialog(task));
    return card;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ===== Dialog (create/edit) =====
  document.getElementById('new-task-btn').addEventListener('click', () => openDialog(null));
  document.getElementById('cancel-dialog-btn').addEventListener('click', () => dialog.close());

  function openDialog(task) {
    state.editingId = task ? task.id : null;
    dialogTitle.textContent = task ? 'Edit task' : 'New task';
    deleteBtn.hidden = !task;
    taskForm.title.value = task?.title || '';
    taskForm.description.value = task?.description || '';
    taskForm.priority.value = task?.priority || 'medium';
    taskForm.dueDate.value = task?.dueDate ? task.dueDate.slice(0, 10) : '';
    dialog.showModal();
  }

  taskForm.addEventListener('submit', async e => {
    const data = Object.fromEntries(new FormData(taskForm));
    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority,
      dueDate: data.dueDate || null,
    };
    try {
      if (state.editingId) {
        const { task } = await api(`/api/tasks/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        upsertTask(task);
      } else {
        const { task } = await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
        upsertTask(task);
      }
    } catch (err) {
      alert(err.message);
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!state.editingId) return;
    if (!confirm('Delete this task? This can\'t be undone.')) return;
    await api(`/api/tasks/${state.editingId}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter(t => t.id !== state.editingId);
    render();
    dialog.close();
  });

  // ===== Boot =====
  if (state.token && state.user) showBoardScreen();
  else showAuthScreen();
})();
