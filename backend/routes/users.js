import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all users (team members)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role, status, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password');

    // Add task count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const taskCount = await Task.countDocuments({ assignee: user._id });
        const projectCount = await Project.countDocuments({
          teamMembers: user._id,
        });
        return {
          ...user.toObject(),
          assignedTasksCount: taskCount,
          projectsCount: projectCount,
        };
      })
    );

    res.status(200).json({ users: usersWithStats });
  })
);

// Get user by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedTasks assignedProjects');

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
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (department !== undefined) user.department = department;

    await user.save();
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
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  })
);

export default router;
