import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, ChevronDown } from 'lucide-react';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout, API } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-search">
        <Search size={20} />
        <input type="text" placeholder="Search tasks, projects..." />
      </div>

      <div className="navbar-actions">
        <div className="notification-container">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-btn" onClick={() => API.put('/notifications/read-all')}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                    >
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-notifications">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-container">
          <button
            className="user-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="user-avatar-small">{user?.name?.[0]?.toUpperCase()}</div>
            <span>{user?.name}</span>
            <ChevronDown size={16} />
          </button>

          {showMenu && (
            <div className="user-menu">
              <a href="#" className="menu-item">Profile</a>
              <a href="#" className="menu-item">Settings</a>
              <hr />
              <button className="menu-item logout" onClick={logout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
