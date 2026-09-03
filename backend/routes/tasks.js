import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all tasks
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, priority, projectId, assigneeId, search } = req.query;
    const tasks = db.listTasks({
      userId: req.user.id,
      status,
      priority,
      projectId,
      assigneeId,
      search,
    });
    res.status(200).json({ tasks });
  })
);

// Create task
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, projectId, assigneeId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = db.createTask({
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      creator: req.user.id,
      assignee: assigneeId || null,
      project: projectId || null,
    });

    if (assigneeId && assigneeId !== req.user.id) {
      db.createNotification({
        user: assigneeId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you "${title}"`,
        relatedTask: task.id,
        relatedUser: req.user.id,
      });
    }

    res.status(201).json({ task });
  })
);

// Get task by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = db.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = task.creator?._id || task.creator?.id || task.creator;
    const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;

    if (creatorId !== req.user.id && assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ task });
  })
);

// Update task
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate, assigneeId, completionPercentage } = req.body;

    const existingTask = db.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = existingTask.creator?._id || existingTask.creator?.id || existingTask.creator;
    if (creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const patch = {};
    if (title) patch.title = title.trim();
    if (description !== undefined) patch.description = description;
    if (status) patch.status = status;
    if (priority) patch.priority = priority;
    if (dueDate) patch.dueDate = dueDate;
    if (assigneeId) patch.assignee = assigneeId;
    if (completionPercentage !== undefined) patch.completionPercentage = completionPercentage;

    const task = db.updateTask(req.params.id, patch);

    res.status(200).json({ task });
  })
);

// Delete task
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existingTask = db.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = existingTask.creator?._id || existingTask.creator?.id || existingTask.creator;
    if (creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.deleteTask(req.params.id);
    res.status(200).json({ message: 'Task deleted' });
  })
);

// Add comment to task
router.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const comments = db.addCommentToTask(req.params.id, {
      userId: req.user.id,
      text: text.trim(),
    });

    if (!comments) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(201).json({ comments });
  })
);

export default router;
