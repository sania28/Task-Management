import express from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all users (team members)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role, status, search } = req.query;
    const users = db.listUsers({ role, status, search });

    const usersWithStats = users.map((user) => {
      const userTasks = db.listTasks({ assigneeId: user.id });
      const userProjects = db.listProjects({ userId: user.id });
      return {
        ...user,
        assignedTasksCount: userTasks.length,
        projectsCount: userProjects.length,
      };
    });

    res.status(200).json({ users: usersWithStats });
  })
);

// Get user by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = db.findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  })
);

// Update user profile
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Can only update own profile' });
    }

    const { name, avatar, bio, department } = req.body;
    const patch = {};

    if (name) patch.name = name.trim();
    if (avatar !== undefined) patch.avatar = avatar;
    if (bio !== undefined) patch.bio = bio;
    if (department !== undefined) patch.department = department;

    const user = db.updateUser(req.params.id, patch);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  })
);

// Change password
router.post(
  '/:id/change-password',
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Can only change own password' });
    }

    const { currentPassword, newPassword } = req.body;
    const userWithPassword = db.findUserByIdWithPassword(req.params.id);

    if (!userWithPassword) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const match = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    db.updateUser(req.params.id, { password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  })
);

export default router;
