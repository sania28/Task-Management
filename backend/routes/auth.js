import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import { generateToken } from '../utils/helpers.js';
import { authLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Register
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({
        error: 'Email and password (min 6 chars) are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  })
);

// Login
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate('assignedTasks assignedProjects');
    res.status(200).json({ user });
  })
);

export default router;
