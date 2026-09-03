import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all projects
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const projects = db.listProjects({ userId: req.user.id, status, search });
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

    const project = db.createProject({
      name: name.trim(),
      description: description || '',
      startDate: startDate || null,
      dueDate: dueDate || null,
      owner: req.user.id,
    });

    res.status(201).json({ project });
  })
);

// Get project by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = db.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = (project.teamMembers || []).some(
      (m) => (m._id || m.id) === req.user.id
    );

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

    const existingProject = db.getProjectById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = existingProject.owner?._id || existingProject.owner?.id || existingProject.owner;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can update project' });
    }

    const patch = {};
    if (name) patch.name = name.trim();
    if (description !== undefined) patch.description = description;
    if (status) patch.status = status;
    if (progress !== undefined) patch.progress = progress;
    if (startDate) patch.startDate = startDate;
    if (dueDate) patch.dueDate = dueDate;

    const project = db.updateProject(req.params.id, patch);

    res.status(200).json({ project });
  })
);

// Add team member to project
router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    const existingProject = db.getProjectById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = existingProject.owner?._id || existingProject.owner?.id || existingProject.owner;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    const currentMembers = (existingProject.teamMembers || []).map((m) => m._id || m.id);
    if (currentMembers.includes(userId)) {
      return res.status(409).json({ error: 'User already a member' });
    }

    const updatedMembers = [...currentMembers, userId];
    const project = db.updateProject(req.params.id, { teamMembers: updatedMembers });

    db.createNotification({
      user: userId,
      type: 'project_update',
      title: 'Added to Project',
      message: `${req.user.name} added you to "${project.name}"`,
      relatedProject: project.id,
      relatedUser: req.user.id,
    });

    res.status(200).json({ project });
  })
);

// Remove team member from project
router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req, res) => {
    const existingProject = db.getProjectById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = existingProject.owner?._id || existingProject.owner?.id || existingProject.owner;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }

    const currentMembers = (existingProject.teamMembers || []).map((m) => m._id || m.id);
    const updatedMembers = currentMembers.filter((mId) => mId !== req.params.userId);

    const project = db.updateProject(req.params.id, { teamMembers: updatedMembers });

    res.status(200).json({ project });
  })
);

// Delete project
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existingProject = db.getProjectById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = existingProject.owner?._id || existingProject.owner?.id || existingProject.owner;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can delete project' });
    }

    db.deleteProject(req.params.id);

    res.status(200).json({ message: 'Project deleted' });
  })
);

export default router;
