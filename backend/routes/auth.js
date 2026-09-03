import express from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../db.js';
import { generateToken } from '../utils/helpers.js';
import { authLimiter } from '../config/rateLimiter.js';
import authMiddleware from '../middleware/auth.js';

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

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = db.createUser({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        _id: user.id,
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

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id || user.id);

    res.status(200).json({
      token,
      user: {
        id: user._id || user.id,
        _id: user._id || user.id,
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
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  })
);

export default router;
