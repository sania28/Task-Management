import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all projects
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const filter = { $or: [{ owner: req.user.id }, { teamMembers: req.user.id }] };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner teamMembers', 'name email avatar role');

    res.status(200).json({ projects });
  })
);

// Create project
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description, startDate, dueDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      startDate: startDate || null,
      dueDate: dueDate || null,
      owner: req.user.id,
      teamMembers: [req.user.id],
    });

    await project.populate('owner teamMembers', 'name email avatar role');

    res.status(201).json({ project });
  })
);

// Get project by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate('owner teamMembers tasks comments.user', 'name email avatar role')
      .populate({
        path: 'tasks',
        populate: { path: 'assignee creator', select: 'name email avatar' },
      });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.teamMembers.some((m) => {
      const memberId = m?._id ? m._id.toString() : m?.toString();
      return memberId === req.user.id;
    });
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ project });
  })
);

// Update project
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, description, status, progress, startDate, dueDate } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can update project' });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (progress !== undefined) project.progress = progress;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;

    await project.save();
    await project.populate('owner teamMembers', 'name email avatar role');

    res.status(200).json({ project });
  })
);

// Add team member to project
router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    const isAlreadyMember = project.teamMembers.some((m) => {
      const id = m?._id ? m._id.toString() : m?.toString();
      return id === userId;
    });

    if (isAlreadyMember) {
      return res.status(409).json({ error: 'User already a member' });
    }

    project.teamMembers.push(userId);
    await project.save();
    await project.populate('owner teamMembers', 'name email avatar role');

    // Create notification
    await Notification.create({
      user: userId,
      type: 'project_update',
      title: 'Added to Project',
      message: `${req.user.name} added you to "${project.name}"`,
      relatedProject: project._id,
      relatedUser: req.user.id,
    });

    res.status(200).json({ project });
  })
);

// Remove team member from project
router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }

    project.teamMembers = project.teamMembers.filter((m) => {
      const id = m?._id ? m._id.toString() : m?.toString();
      return id !== req.params.userId;
    });
    await project.save();
    await project.populate('owner teamMembers', 'name email avatar role');

    res.status(200).json({ project });
  })
);

// Delete project
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can delete project' });
    }

    // Delete all tasks associated with project
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Project deleted' });
  })
);

export default router;
