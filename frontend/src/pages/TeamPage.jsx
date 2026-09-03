import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Users, AlertCircle, Plus, X } from 'lucide-react';
import '../styles/team.css';

const TeamPage = () => {
  const { API } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        API.get('/users'),
        API.get('/teams'),
      ]);
      setUsers(usersRes.data.users || []);
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      setError('Failed to load team details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      await API.post('/teams', { name: teamName, description: teamDesc });
      setTeamName('');
      setTeamDesc('');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create team');
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
              <h1>Team Directory & Groups</h1>
              <p>View organization members and manage teams</p>
            </div>
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Create Team Group
            </button>
          </div>

          {loading ? (
            <div className="loading-container">Loading team members...</div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle size={32} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {teams.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#0f172a' }}>Teams</h2>
                  <div className="team-grid">
                    {teams.map((t) => (
                      <div key={t._id} className="member-card" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0f172a' }}>{t.name}</div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{t.description || 'No description'}</p>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                          👥 {t.members?.length || 0} Members
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#0f172a' }}>All Members</h2>
              <div className="team-grid">
                {users.map((member) => (
                  <div key={member._id} className="member-card">
                    <div className="member-card-avatar">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="member-card-name">{member.name}</div>
                    <div className="member-card-role">{member.role}</div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{member.email}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                      <span>📋 {member.assignedTasksCount || 0} Tasks</span>
                      <span>📁 {member.projectsCount || 0} Projects</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>Create Team Group</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTeam}>
                  <div className="form-group">
                    <label>Team Name</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Frontend Core"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={teamDesc}
                      onChange={(e) => setTeamDesc(e.target.value)}
                      placeholder="Team purpose and focus..."
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Create Team
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

export default TeamPage;
