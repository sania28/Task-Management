import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get dashboard statistics
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const userTasks = db.listTasks({ userId });
    const userProjects = db.listProjects({ userId });

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = userTasks.filter((t) => t.status === 'todo').length;
    const inProgressTasks = userTasks.filter((t) => t.status === 'in_progress').length;
    const overdueTasks = userTasks.filter((t) => t.isOverdue).length;

    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter((p) => p.status === 'active').length;

    const teamMemberIds = new Set();
    userProjects.forEach((p) => {
      (p.teamMembers || []).forEach((m) => {
        const id = m._id || m.id;
        if (id && id !== userId) teamMemberIds.add(id);
      });
    });

    const statusCounts = {};
    userTasks.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    const tasksByStatus = Object.keys(statusCounts).map((status) => ({
      _id: status,
      count: statusCounts[status],
    }));

    const priorityCounts = {};
    userTasks.forEach((t) => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    const tasksByPriority = Object.keys(priorityCounts).map((priority) => ({
      _id: priority,
      count: priorityCounts[priority],
    }));

    const recentTasks = userTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentProjects = userProjects
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

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
          members: teamMemberIds.size,
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
