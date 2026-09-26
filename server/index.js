import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import {
  connectMongo,
  isMongoConnected,
  Project,
  About,
  Settings,
  Resume
} from './mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'luxury-portfolio-secret-key-2026-supersecure';
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for Resume PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `resume_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for resumes.'));
    }
  }
});

app.use(cors());
app.use(express.json());

// Helper to read and write database fallback
function getDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    throw err;
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
    throw err;
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token.' });
    }
    req.user = decoded;
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return res.status(503).json({
      error: 'ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables.'
    });
  }

  const emailMatches = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
  let passwordMatches = false;

  try {
    const passwordBuffer = Buffer.from(password);
    const expectedBuffer = Buffer.from(expectedPassword);
    if (passwordBuffer.length === expectedBuffer.length) {
      passwordMatches = crypto.timingSafeEqual(passwordBuffer, expectedBuffer);
    }
  } catch (e) {
    passwordMatches = false;
  }

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ error: 'Invalid admin email or password.' });
  }

  const token = jwt.sign(
    { email: expectedEmail, role: 'superadmin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    token,
    user: {
      email: expectedEmail,
      role: 'superadmin'
    }
  });
});

// Verify Current User / Session Check
app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({
    user: {
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 2. PUBLIC PORTFOLIO ENDPOINTS
// ==========================================

// Get all public portfolio content
app.get('/api/portfolio', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find({}).sort({ sortOrder: 1 }).lean();
      const about = (await About.findOne({}).lean()) || {};
      const settings = (await Settings.findOne({}).lean()) || {};
      const resume = (await Resume.findOne({}).lean()) || { activeResumeUrl: '/resume.pdf' };
      return res.json({
        projects,
        about,
        settings,
        resume
      });
    }
  } catch (err) {
    console.warn('[MongoDB] Query fallback:', err.message);
  }

  const db = getDb();
  const projects = (db.projects || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  res.json({
    projects,
    about: db.about || {},
    settings: db.settings || {},
    resume: db.resume || { activeResumeUrl: '/resume.pdf' }
  });
});

// ==========================================
// 3. PROTECTED ADMIN CMS ENDPOINTS
// ==========================================

// Projects CRUD
app.post('/api/portfolio/projects', authenticateToken, async (req, res) => {
  const { title, category, description, tags, previewType, link, github, status, featured } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Project title is required.' });
  }

  const newProject = {
    id: `proj_${Date.now()}`,
    title: title.trim(),
    category: category || 'Web Development',
    description: description || '',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    previewType: previewType || 'canvas',
    link: link || '#',
    github: github || '#',
    status: status || 'Completed',
    featured: !!featured,
    sortOrder: Date.now()
  };

  try {
    if (isMongoConnected()) {
      const count = await Project.countDocuments();
      newProject.sortOrder = count + 1;
      await Project.create(newProject);
    }
  } catch (err) {
    console.warn('[MongoDB] Project create error:', err.message);
  }

  // Also update local fallback
  const db = getDb();
  db.projects = db.projects || [];
  db.projects.push(newProject);
  saveDb(db);

  return res.status(201).json({ success: true, project: newProject });
});

app.put('/api/portfolio/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.tags && !Array.isArray(updateData.tags)) {
    updateData.tags = updateData.tags.split(',').map(t => t.trim());
  }
  if (updateData.sortOrder !== undefined) {
    updateData.sortOrder = Number(updateData.sortOrder);
  }

  let updatedProj = null;
  try {
    if (isMongoConnected()) {
      updatedProj = await Project.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();
    }
  } catch (err) {
    console.warn('[MongoDB] Project update error:', err.message);
  }

  // Update local fallback
  const db = getDb();
  const projectIdx = (db.projects || []).findIndex(p => p.id === id);
  if (projectIdx !== -1) {
    db.projects[projectIdx] = {
      ...db.projects[projectIdx],
      ...updateData
    };
    saveDb(db);
    if (!updatedProj) updatedProj = db.projects[projectIdx];
  }

  if (!updatedProj) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  return res.json({ success: true, project: updatedProj });
});

app.delete('/api/portfolio/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected()) {
      await Project.deleteOne({ id });
    }
  } catch (err) {
    console.warn('[MongoDB] Project delete error:', err.message);
  }

  const db = getDb();
  const beforeLen = db.projects?.length || 0;
  db.projects = (db.projects || []).filter(p => p.id !== id);

  if (db.projects.length === beforeLen) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  saveDb(db);
  return res.json({ success: true, message: 'Project removed.' });
});

app.put('/api/portfolio/projects-reorder', authenticateToken, async (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array of project IDs.' });
  }

  try {
    if (isMongoConnected()) {
      for (let i = 0; i < orderedIds.length; i++) {
        await Project.updateOne({ id: orderedIds[i] }, { $set: { sortOrder: i + 1 } });
      }
    }
  } catch (err) {
    console.warn('[MongoDB] Reorder error:', err.message);
  }

  // Local sync
  const db = getDb();
  const projectsMap = new Map((db.projects || []).map(p => [p.id, p]));
  const reordered = [];

  orderedIds.forEach((id, idx) => {
    if (projectsMap.has(id)) {
      const proj = projectsMap.get(id);
      proj.sortOrder = idx + 1;
      reordered.push(proj);
      projectsMap.delete(id);
    }
  });

  for (const remaining of projectsMap.values()) {
    remaining.sortOrder = reordered.length + 1;
    reordered.push(remaining);
  }

  db.projects = reordered;
  saveDb(db);
  return res.json({ success: true, projects: db.projects });
});

// Update About Section
app.put('/api/portfolio/about', authenticateToken, async (req, res) => {
  const updateData = req.body;
  let updatedAbout = null;

  try {
    if (isMongoConnected()) {
      updatedAbout = await About.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true }).lean();
    }
  } catch (err) {
    console.warn('[MongoDB] About update error:', err.message);
  }

  // Local sync
  const db = getDb();
  db.about = {
    ...db.about,
    ...updateData
  };
  saveDb(db);

  return res.json({ success: true, about: updatedAbout || db.about });
});

// Update Technical Arsenal / Skills specifically
app.put('/api/portfolio/skills', authenticateToken, async (req, res) => {
  const { skillCategories } = req.body;

  if (!Array.isArray(skillCategories)) {
    return res.status(400).json({ error: 'skillCategories must be an array.' });
  }

  let updatedAbout = null;
  try {
    if (isMongoConnected()) {
      updatedAbout = await About.findOneAndUpdate({}, { $set: { skillCategories } }, { new: true, upsert: true }).lean();
    }
  } catch (err) {
    console.warn('[MongoDB] Skills update error:', err.message);
  }

  const db = getDb();
  db.about = db.about || {};
  db.about.skillCategories = skillCategories;
  saveDb(db);

  return res.json({ success: true, skillCategories, about: updatedAbout || db.about });
});

// Update Contact & Settings
app.put('/api/portfolio/settings', authenticateToken, async (req, res) => {
  const updateData = req.body;
  let updatedSettings = null;

  try {
    if (isMongoConnected()) {
      updatedSettings = await Settings.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true }).lean();
    }
  } catch (err) {
    console.warn('[MongoDB] Settings update error:', err.message);
  }

  const db = getDb();
  db.settings = {
    ...db.settings,
    ...updateData
  };
  saveDb(db);

  return res.json({ success: true, settings: updatedSettings || db.settings });
});

// Resume Management
app.post('/api/portfolio/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was provided.' });
  }

  const resumeUrl = `/uploads/${req.file.filename}`;
  const resumeData = {
    activeResumeUrl: resumeUrl,
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    fileSizeBytes: req.file.size,
    updatedAt: new Date()
  };

  try {
    if (isMongoConnected()) {
      await Resume.findOneAndUpdate({}, { $set: resumeData }, { new: true, upsert: true });
    }
  } catch (err) {
    console.warn('[MongoDB] Resume save error:', err.message);
  }

  const db = getDb();
  db.resume = resumeData;
  saveDb(db);

  return res.json({ success: true, resume: resumeData });
});

app.delete('/api/portfolio/resume', authenticateToken, async (req, res) => {
  const defaultResume = {
    activeResumeUrl: '/resume.pdf',
    filename: 'Shivam_Verma_Resume.pdf',
    updatedAt: new Date()
  };

  try {
    if (isMongoConnected()) {
      await Resume.findOneAndUpdate({}, { $set: defaultResume }, { new: true, upsert: true });
    }
  } catch (err) {
    console.warn('[MongoDB] Resume delete error:', err.message);
  }

  const db = getDb();
  db.resume = defaultResume;
  saveDb(db);

  return res.json({ success: true, resume: defaultResume });
});

// Connect to MongoDB Atlas
connectMongo().catch(err => {
  console.error('[MongoDB] Initial connection error:', err);
});

// Serve public files (uploads, resume.pdf)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// Serve production frontend build (dist) and SPA fallback
const DIST_PATH = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

// Server listener
app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});

export default app;
