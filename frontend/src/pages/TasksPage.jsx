import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Plus, Search, Trash2, X, MessageSquare, AlertCircle } from 'lucide-react';
import '../styles/tasks.css';

const TasksPage = () => {
  const { API, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    projectId: '',
    assigneeId: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [search, priorityFilter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await API.get('/tasks', { params });
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await API.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await API.get('/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      projectId: '',
      assigneeId: '',
    });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      projectId: task.project?._id || task.project || '',
      assigneeId: task.assignee?._id || task.assignee || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await API.put(`/tasks/${editingTask._id}`, formData);
      } else {
        await API.post('/tasks', formData);
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !editingTask) return;
    try {
      const res = await API.post(`/tasks/${editingTask._id}/comments`, { text: commentText });
      setEditingTask({ ...editingTask, comments: res.data.comments });
      setCommentText('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', emoji: '📝' },
    { id: 'in_progress', title: 'In Progress', emoji: '⚡' },
    { id: 'completed', title: 'Completed', emoji: '✅' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="page-container">
          <div className="tasks-header">
            <div>
              <h1>Tasks</h1>
              <p>Manage and track project tasks</p>
            </div>
            <button className="primary-btn" onClick={openCreateModal}>
              <Plus size={18} /> New Task
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="navbar-search" style={{ width: '280px' }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-container">Loading tasks...</div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle size={32} />
              <span>{error}</span>
            </div>
          ) : (
            <div className="kanban-board">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-column">
                    <div className="kanban-column-header">
                      <h2>
                        {col.emoji} {col.title}
                      </h2>
                      <span className="count">{colTasks.length}</span>
                    </div>

                    <div className="card-list">
                      {colTasks.length === 0 ? (
                        <p className="empty-state">No tasks here</p>
                      ) : (
                        colTasks.map((task) => (
                          <div
                            key={task._id}
                            className="task-card"
                            onClick={() => openEditModal(task)}
                          >
                            <div className="task-card-title">{task.title}</div>
                            {task.description && (
                              <div className="task-card-desc">{task.description}</div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={`priority-badge ${task.priority}`}>
                                {task.priority}
                              </span>
                              {task.assignee && (
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  👤 {task.assignee.name}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                gap: '0.35rem',
                                marginTop: '0.75rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid #f1f5f9',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.id !== 'todo' && (
                                <button
                                  className="secondary-btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleStatusChange(task._id, 'todo')}
                                >
                                  To Do
                                </button>
                              )}
                              {col.id !== 'in_progress' && (
                                <button
                                  className="secondary-btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleStatusChange(task._id, 'in_progress')}
                                >
                                  Doing
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  className="secondary-btn"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleStatusChange(task._id, 'completed')}
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Task Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="What needs to be done?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Task details..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Project</label>
                      <select
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      >
                        <option value="">No Project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Assignee</label>
                      <select
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        value={formData.assigneeId}
                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="modal-actions">
                    {editingTask && (
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleDelete(editingTask._id)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Save Task
                    </button>
                  </div>
                </form>

                {editingTask && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <h3>Comments</h3>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', margin: '0.5rem 0' }}>
                      {editingTask.comments?.map((c, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', marginBottom: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                          <strong>{c.user?.name || 'User'}: </strong>
                          <span>{c.text}</span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button type="submit" className="primary-btn" style={{ padding: '0.5rem 0.75rem' }}>
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TasksPage;
