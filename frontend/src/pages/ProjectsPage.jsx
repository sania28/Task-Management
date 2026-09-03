import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Plus, Search, Trash2, X, Users, AlertCircle } from 'lucide-react';
import '../styles/projects.css';

const ProjectsPage = () => {
  const { API } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [search]);

  const fetchProjects = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const response = await API.get('/projects', { params });
      setProjects(response.data.projects || []);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
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
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      dueDate: '',
    });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'planning',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, formData);
      } else {
        await API.post('/projects', formData);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Deleting this project will delete all associated tasks. Continue?')) return;
    try {
      await API.delete(`/projects/${projectId}`);
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleAddMember = async (projectId, userId) => {
    if (!userId) return;
    try {
      await API.post(`/projects/${projectId}/members`, { userId });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="page-container">
          <div className="tasks-header">
            <div>
              <h1>Projects</h1>
              <p>Manage project status and team members</p>
            </div>
            <button className="primary-btn" onClick={openCreateModal}>
              <Plus size={18} /> New Project
            </button>
          </div>

          <div className="navbar-search" style={{ width: '300px', marginBottom: '1.5rem' }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-container">Loading projects...</div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle size={32} />
              <span>{error}</span>
            </div>
          ) : projects.length === 0 ? (
            <p className="empty-state">No projects found.</p>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project._id} className="project-card" onClick={() => openEditModal(project)}>
                  <div className="project-card-header">
                    <div className="project-card-title">{project.name}</div>
                    <span className={`status-badge ${project.status}`}>{project.status}</span>
                  </div>

                  <p className="project-card-desc">{project.description || 'No description provided.'}</p>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ width: '100%' }}>
                      <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div className="project-members">
                      {project.teamMembers?.map((m) => (
                        <div key={m._id} className="member-avatar-mini" title={m.name}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                      ))}
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        style={{ fontSize: '0.75rem', padding: '0.2rem', borderRadius: '4px' }}
                        onChange={(e) => handleAddMember(project._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add Member</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Project title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Project goals and overview..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
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

                  <div className="modal-actions">
                    {editingProject && (
                      <button type="button" className="danger-btn" onClick={() => handleDelete(editingProject._id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                    <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Save Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
