import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import '../styles/settings.css';

const SettingsPage = () => {
  const { user, API } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.put(`/users/${user.id}`, profileData);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post(`/users/${user.id}/change-password`, passwordData);
      setMessage('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="page-container">
          <div className="page-header">
            <h1>Account Settings</h1>
            <p>Manage your profile and account preferences</p>
          </div>

          <div className="settings-container">
            {message && <div className="success-message">{message}</div>}
            {error && <div className="auth-error">{error}</div>}

            <section className="settings-section">
              <h2>Profile Details</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    placeholder="e.g. Engineering, Design, Product"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    rows="3"
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Short bio about yourself..."
                  />
                </div>

                <button type="submit" className="primary-btn">
                  Update Profile
                </button>
              </form>
            </section>

            <section className="settings-section">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>

                <button type="submit" className="primary-btn">
                  Update Password
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
