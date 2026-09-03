import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TaskChart from '../components/TaskChart';
import { BarChart3, CheckCircle2, Clock, AlertCircle, Briefcase, Users } from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { API } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await API.get('/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Navbar />
          <div className="loading-container">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Navbar />
          <div className="error-container">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={fetchDashboard}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  const { statistics, recentTasks, recentProjects, charts } = dashboardData || {};

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="dashboard-container">
          <div className="page-header">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your project overview</p>
          </div>

          {/* Statistics Cards */}
          <section className="stats-grid">
            <StatCard
              icon={BarChart3}
              label="Total Tasks"
              value={statistics?.tasks.total || 0}
              color="blue"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={statistics?.tasks.completed || 0}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={statistics?.tasks.inProgress || 0}
              color="amber"
            />
            <StatCard
              icon={AlertCircle}
              label="Overdue"
              value={statistics?.tasks.overdue || 0}
              color="red"
            />
            <StatCard
              icon={Briefcase}
              label="Total Projects"
              value={statistics?.projects.total || 0}
              color="purple"
            />
            <StatCard
              icon={Users}
              label="Team Members"
              value={statistics?.team.members || 0}
              color="indigo"
            />
          </section>

          {/* Charts */}
          <section className="charts-section">
            <TaskChart title="Tasks by Status" data={charts?.tasksByStatus} type="status" />
            <TaskChart title="Tasks by Priority" data={charts?.tasksByPriority} type="priority" />
          </section>

          {/* Recent Tasks & Projects */}
          <section className="recent-section">
            <div className="recent-tasks">
              <h2>Recent Tasks</h2>
              {recentTasks?.length > 0 ? (
                <div className="task-list">
                  {recentTasks.map((task) => (
                    <div key={task._id} className="task-item">
                      <div className="task-info">
                        <h3>{task.title}</h3>
                        <p>{task.project?.name || 'No project'}</p>
                      </div>
                      <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No tasks yet</p>
              )}
            </div>

            <div className="recent-projects">
              <h2>Recent Projects</h2>
              {recentProjects?.length > 0 ? (
                <div className="project-list">
                  {recentProjects.map((project) => (
                    <div key={project._id} className="project-item">
                      <div className="project-info">
                        <h3>{project.name}</h3>
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span>{project.progress}%</span>
                        </div>
                      </div>
                      <span className={`status-badge ${project.status}`}>{project.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No projects yet</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
