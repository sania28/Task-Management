import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get conversations
router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const allUsers = db.listUsers().filter((u) => u.id !== req.user.id);
    const conversations = allUsers.map((user) => {
      const messages = db.listMessagesBetween(req.user.id, user.id);
      const lastMessage = messages[messages.length - 1] || null;
      return {
        user,
        lastMessage,
      };
    }).filter((c) => c.lastMessage);

    res.status(200).json({ conversations });
  })
);

// Get messages with user
router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const messages = db.listMessagesBetween(req.user.id, req.params.userId);
    res.status(200).json({ messages });
  })
);

// Send message
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { recipientId, content } = req.body;

    if (!recipientId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Recipient and message content required' });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const message = db.createMessage({
      sender: req.user.id,
      recipient: recipientId,
      content: content.trim(),
    });

    db.createNotification({
      user: recipientId,
      type: 'message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`,
      relatedUser: req.user.id,
    });

    res.status(201).json({ message });
  })
);

export default router;
