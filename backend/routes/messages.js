import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get conversations
router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    }).sort({ createdAt: -1 });

    const conversationMap = new Map();
    messages.forEach((msg) => {
      const other =
        msg.sender.toString() === req.user.id ? msg.recipient : msg.sender;
      if (!conversationMap.has(other.toString())) {
        conversationMap.set(other.toString(), msg);
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ conversations });
  })
);

// Get messages with user
router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender recipient', 'name email avatar');

    // Mark as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        recipient: req.user.id,
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

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

    const conversationId = [req.user.id, recipientId].sort().join('-');

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      content: content.trim(),
      conversationId,
    });

    await message.populate('sender recipient', 'name email avatar');

    // Create notification
    await Notification.create({
      user: recipientId,
      type: 'message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`,
      relatedUser: req.user.id,
    });

    res.status(201).json({ message });
  })
);

// Mark messages as read
router.put(
  '/:messageId/read',
  asyncHandler(async (req, res) => {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json({ message });
  })
);

export default router;
