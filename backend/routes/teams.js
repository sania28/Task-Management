import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get user's teams
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const teams = db.listTeams({ userId: req.user.id, search });
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

    const team = db.createTeam({
      name: name.trim(),
      description: description || '',
      owner: req.user.id,
    });

    res.status(201).json({ team });
  })
);

// Get team by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const team = db.getTeamById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = (team.members || []).some((m) => {
      const memberId = m.user?._id || m.user?.id || m.user;
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
    const existingTeam = db.getTeamById(req.params.id);
    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ownerId = existingTeam.owner?._id || existingTeam.owner?.id || existingTeam.owner;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can delete team' });
    }

    db.deleteTeam(req.params.id);
    res.status(200).json({ message: 'Team deleted' });
  })
);

export default router;
