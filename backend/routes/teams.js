import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get user's teams
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const filter = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id },
      ],
    };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const teams = await Team.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner members.user projects', 'name email avatar role status');

    res.status(200).json({ teams });
  })
);

// Create team
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description || '',
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'owner',
        },
      ],
    });

    await team.populate('owner members.user projects', 'name email avatar role status');

    res.status(201).json({ team });
  })
);

// Get team by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id)
      .populate('owner members.user projects', 'name email avatar role status');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = team.members.some((m) => {
      const memberId = m.user?._id ? m.user._id.toString() : m.user?.toString();
      return memberId === req.user.id;
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ team });
  })
);

// Delete team
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ownerId = team.owner?._id ? team.owner._id.toString() : team.owner?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can delete team' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Team deleted' });
  })
);

export default router;
