import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const seed = async () => {
  try {
    console.log('Seeding JSON file database...');

    db.clearAll();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const user1 = db.createUser({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: hashedPassword,
      role: 'admin',
      bio: 'Engineering Lead & Project Manager',
      department: 'Engineering',
    });

    const user2 = db.createUser({
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      password: hashedPassword,
      role: 'developer',
      bio: 'Full Stack Developer',
      department: 'Engineering',
    });

    console.log('Created seed users.');

    const project1 = db.createProject({
      name: 'Website Redesign',
      description: 'Overhaul corporate website with modern React frontend',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      owner: user1.id,
    });

    db.updateProject(project1.id, {
      teamMembers: [user1.id, user2.id],
      status: 'active',
      progress: 50,
    });

    console.log('Created seed project.');

    db.createTask({
      title: 'Design Wireframes',
      description: 'Create responsive wireframes for dashboard and task board',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      creator: user1.id,
      assignee: user2.id,
      project: project1.id,
    });

    db.createTask({
      title: 'Build REST API',
      description: 'Implement Express routes for tasks, projects, users, and teams',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      creator: user1.id,
      assignee: user1.id,
      project: project1.id,
    });

    console.log('Created seed tasks.');

    db.createTeam({
      name: 'Frontend Core',
      description: 'Core web application development team',
      owner: user1.id,
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
