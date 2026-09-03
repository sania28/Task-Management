import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get notifications
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { unreadOnly } = req.query;
    const notifications = db.listNotifications(req.user.id, {
      unreadOnly: unreadOnly === 'true',
    });

    const unreadCount = db.listNotifications(req.user.id, { unreadOnly: true }).length;

    res.status(200).json({ notifications, unreadCount });
  })
);

// Mark notification as read
router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = db.markNotificationRead(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ notification });
  })
);

// Mark all notifications as read
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    db.markAllNotificationsRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  })
);

export default router;
