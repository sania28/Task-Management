import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Send, User as UserIcon, AlertCircle } from 'lucide-react';
import '../styles/messages.css';

const MessagesPage = () => {
  const { API, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMessages(activeUser._id);
      const interval = setInterval(() => fetchMessages(activeUser._id), 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [activeUser]);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/users');
      const otherUsers = (response.data.users || []).filter((u) => u._id !== currentUser.id);
      setUsers(otherUsers);
      if (otherUsers.length > 0) {
        setActiveUser(otherUsers[0]);
      }
    } catch (err) {
      setError('Failed to load team members for messaging');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await API.get(`/messages/${userId}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeUser) return;

    try {
      const response = await API.post('/messages', {
        recipientId: activeUser._id,
        content: messageText,
      });
      setMessages([...messages, response.data.message]);
      setMessageText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="messages-layout">
          <div className="conversations-sidebar">
            <div className="conversations-header">Direct Messages</div>
            {loading ? (
              <div className="loading-container">Loading contacts...</div>
            ) : error ? (
              <div className="error-container">
                <AlertCircle size={24} />
                <span>{error}</span>
              </div>
            ) : users.length === 0 ? (
              <p className="empty-state" style={{ padding: '1rem' }}>No other users found</p>
            ) : (
              users.map((u) => (
                <div
                  key={u._id}
                  className={`conversation-item ${activeUser?._id === u._id ? 'active' : ''}`}
                  onClick={() => setActiveUser(u)}
                >
                  <div className="user-avatar-small">{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-area">
            {activeUser ? (
              <>
                <div className="chat-header">
                  <div className="user-avatar-small">{activeUser.name?.[0]?.toUpperCase()}</div>
                  <span>{activeUser.name}</span>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <p className="empty-state">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg) => {
                      const senderId = msg.sender?._id || msg.sender;
                      const isSent = senderId === currentUser.id;
                      return (
                        <div
                          key={msg._id}
                          className={`message-bubble ${isSent ? 'sent' : 'received'}`}
                        >
                          {msg.content}
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={`Message ${activeUser.name}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button type="submit" className="primary-btn">
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="loading-container">Select a contact to message</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
