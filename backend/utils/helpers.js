import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const generateNotification = (userId, type, title, message, relatedData = {}) => {
  return {
    user: userId,
    type,
    title,
    message,
    ...relatedData,
    createdAt: new Date(),
  };
};

export const calculateProjectProgress = (totalTasks, completedTasks) => {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};

export const isTaskOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return new Date(dueDate) < new Date();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
