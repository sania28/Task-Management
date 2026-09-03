import express from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get dashboard statistics
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Task statistics
    const totalTasks = await Task.countDocuments({
      $or: [{ creator: userId }, { assignee: userId }],
    });
    const completedTasks = await Task.countDocuments({
      $or: [{ creator: userId }, { assignee: userId }],
      status: 'completed',
    });
    const pendingTasks = await Task.countDocuments({
      $or: [{ creator: userId }, { assignee: userId }],
      status: 'todo',
    });
    const inProgressTasks = await Task.countDocuments({
      $or: [{ creator: userId }, { assignee: userId }],
      status: 'in_progress',
    });
    const overdueTasks = await Task.countDocuments({
      $or: [{ creator: userId }, { assignee: userId }],
      isOverdue: true,
    });

    // Project statistics
    const totalProjects = await Project.countDocuments({
      $or: [{ owner: userId }, { teamMembers: userId }],
    });
    const activeProjects = await Project.countDocuments({
      $or: [{ owner: userId }, { teamMembers: userId }],
      status: 'active',
    });

    // Team statistics
    const userTeams = await Project.find({
      $or: [{ owner: userId }, { teamMembers: userId }],
    }).select('teamMembers');

    const teamMemberIds = new Set();
    userTeams.forEach((project) => {
      project.teamMembers.forEach((id) => {
        if (id.toString() !== userId) {
          teamMemberIds.add(id.toString());
        }
      });
    });

    const teamMembersCount = teamMemberIds.size;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Task distribution by status
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          $or: [
            { creator: userObjectId },
            { assignee: userObjectId },
          ],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Task distribution by priority
    const tasksByPriority = await Task.aggregate([
      {
        $match: {
          $or: [
            { creator: userObjectId },
            { assignee: userObjectId },
          ],
        },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent tasks
    const recentTasks = await Task.find({
      $or: [{ creator: userId }, { assignee: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignee creator project', 'name email avatar');

    // Recent projects
    const recentProjects = await Project.find({
      $or: [{ owner: userId }, { teamMembers: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner teamMembers', 'name email avatar');

    res.status(200).json({
      statistics: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        team: {
          members: teamMembersCount,
        },
      },
      charts: {
        tasksByStatus,
        tasksByPriority,
      },
      recentTasks,
      recentProjects,
    });
  })
);

export default router;
