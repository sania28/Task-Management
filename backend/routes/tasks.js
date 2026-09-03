import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/auth.js';
import { isTaskOverdue } from '../utils/helpers.js';

const router = express.Router();
router.use(authMiddleware);

// Get all tasks
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, priority, projectId, assigneeId, search } = req.query;
    const filter = { $or: [{ creator: req.user.id }, { assignee: req.user.id }] };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.project = projectId;
    if (assigneeId) filter.assignee = assigneeId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .populate('assignee creator project', 'name email avatar');

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

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      creator: req.user.id,
      assignee: assigneeId || null,
      project: projectId || null,
    });

    if (projectId) {
      await Project.findByIdAndUpdate(
        projectId,
        { $push: { tasks: task._id }, $inc: { totalTasks: 1 } },
        { new: true }
      );
    }

    await task.populate('assignee creator project', 'name email avatar');

    // Create notification for assignee
    if (assigneeId && assigneeId !== req.user.id) {
      await Notification.create({
        user: assigneeId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you "${title}"`,
        relatedTask: task._id,
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
    const task = await Task.findById(req.params.id).populate(
      'assignee creator project comments.user',
      'name email avatar'
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = task.creator?._id ? task.creator._id.toString() : task.creator?.toString();
    const assigneeId = task.assignee?._id ? task.assignee._id.toString() : task.assignee?.toString();
    const isOwner = creatorId === req.user.id || assigneeId === req.user.id;
    if (!isOwner) {
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

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = dueDate;
    if (assigneeId) updateData.assignee = assigneeId;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = task.creator?._id ? task.creator._id.toString() : task.creator?.toString();
    if (creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(task, updateData);
    task.isOverdue = isTaskOverdue(task.dueDate, task.status);
    await task.save();
    await task.populate('assignee creator project', 'name email avatar');

    // Update project progress if status changed
    if (status && task.project) {
      const project = await Project.findById(task.project);
      if (project) {
        const completedCount = await Task.countDocuments({
          project: task.project,
          status: 'completed',
        });
        project.completedTasks = completedCount;
        project.progress = Math.round((completedCount / project.totalTasks) * 100);
        await project.save();
      }
    }

    res.status(200).json({ task });
  })
);

// Delete task
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const creatorId = task.creator?._id ? task.creator._id.toString() : task.creator?.toString();
    if (creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (task.project) {
      await Project.findByIdAndUpdate(
        task.project,
        { $pull: { tasks: task._id }, $inc: { totalTasks: -1 } },
        { new: true }
      );
    }

    await Task.findByIdAndDelete(req.params.id);
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

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.user.id,
            text: text.trim(),
          },
        },
      },
      { new: true }
    ).populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(201).json({ comments: task.comments });
  })
);

export default router;
