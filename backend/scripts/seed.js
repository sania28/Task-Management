import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager');
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Team.deleteMany({});

    console.log('Cleared existing data.');

    const user1 = await User.create({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: 'password123',
      role: 'admin',
      bio: 'Engineering Lead & Project Manager',
      department: 'Engineering',
    });

    const user2 = await User.create({
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      password: 'password123',
      role: 'developer',
      bio: 'Full Stack Developer',
      department: 'Engineering',
    });

    console.log('Created seed users.');

    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Overhaul corporate website with modern React frontend',
      status: 'active',
      progress: 50,
      owner: user1._id,
      teamMembers: [user1._id, user2._id],
    });

    console.log('Created seed project.');

    const task1 = await Task.create({
      title: 'Design Wireframes',
      description: 'Create responsive wireframes for dashboard and task board',
      status: 'completed',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3),
      creator: user1._id,
      assignee: user2._id,
      project: project1._id,
    });

    const task2 = await Task.create({
      title: 'Build REST API',
      description: 'Implement Express routes for tasks, projects, users, and teams',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 5),
      creator: user1._id,
      assignee: user1._id,
      project: project1._id,
    });

    console.log('Created seed tasks.');

    await Team.create({
      name: 'Frontend Core',
      description: 'Core web application development team',
      owner: user1._id,
      members: [
        { user: user1._id, role: 'owner' },
        { user: user2._id, role: 'member' },
      ],
      projects: [project1._id],
    });

    console.log('Created seed team.');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
