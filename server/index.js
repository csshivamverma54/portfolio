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

// Helper to read and write database
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

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail safely if either environment variable is missing
  if (!adminEmail || !adminPassword) {
    console.error('[Security] ADMIN_EMAIL or ADMIN_PASSWORD is not configured in environment variables.');
    return res.status(503).json({ error: 'Admin authentication is currently not configured.' });
  }

  // Validate email
  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Validate password (supports plain text or bcrypt hash if provided in env)
  let isMatch = false;
  if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
    isMatch = bcrypt.compareSync(password, adminPassword);
  } else {
    const inputBuf = Buffer.from(password);
    const targetBuf = Buffer.from(adminPassword);
    if (inputBuf.length === targetBuf.length) {
      isMatch = crypto.timingSafeEqual(inputBuf, targetBuf);
    }
  }

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = jwt.sign(
    { email: adminEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: { email: adminEmail, role: 'admin' }
  });
});

// Check Session
app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 2. PUBLIC PORTFOLIO ENDPOINTS
// ==========================================

// Get all public portfolio content
app.get('/api/portfolio', (req, res) => {
  const db = getDb();
  // Sort projects by sortOrder
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
app.post('/api/portfolio/projects', authenticateToken, (req, res) => {
  const db = getDb();
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
    sortOrder: (db.projects?.length || 0) + 1
  };

  db.projects = db.projects || [];
  db.projects.push(newProject);
  saveDb(db);

  return res.status(201).json({ success: true, project: newProject });
});

app.put('/api/portfolio/projects/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const projectIdx = (db.projects || []).findIndex(p => p.id === id);

  if (projectIdx === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const existing = db.projects[projectIdx];
  const { title, category, description, tags, previewType, link, github, status, featured, sortOrder } = req.body;

  db.projects[projectIdx] = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    category: category !== undefined ? category : existing.category,
    description: description !== undefined ? description : existing.description,
    tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : existing.tags,
    previewType: previewType !== undefined ? previewType : existing.previewType,
    link: link !== undefined ? link : existing.link,
    github: github !== undefined ? github : existing.github,
    status: status !== undefined ? status : existing.status,
    featured: featured !== undefined ? !!featured : existing.featured,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder
  };

  saveDb(db);
  return res.json({ success: true, project: db.projects[projectIdx] });
});

app.delete('/api/portfolio/projects/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const beforeLen = db.projects?.length || 0;
  db.projects = (db.projects || []).filter(p => p.id !== id);

  if (db.projects.length === beforeLen) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  saveDb(db);
  return res.json({ success: true, message: 'Project removed.' });
});

app.put('/api/portfolio/projects-reorder', authenticateToken, (req, res) => {
  const db = getDb();
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array of project IDs.' });
  }

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

  // Append any remaining
  for (const remaining of projectsMap.values()) {
    remaining.sortOrder = reordered.length + 1;
    reordered.push(remaining);
  }

  db.projects = reordered;
  saveDb(db);
  return res.json({ success: true, projects: db.projects });
});

// Update About Section
app.put('/api/portfolio/about', authenticateToken, (req, res) => {
  const db = getDb();
  const { heading, subheading, bioTitle, bioParagraph1, bioParagraph2, metrics, highlights, skillCategories } = req.body;

  db.about = {
    ...db.about,
    heading: heading !== undefined ? heading : db.about?.heading,
    subheading: subheading !== undefined ? subheading : db.about?.subheading,
    bioTitle: bioTitle !== undefined ? bioTitle : db.about?.bioTitle,
    bioParagraph1: bioParagraph1 !== undefined ? bioParagraph1 : db.about?.bioParagraph1,
    bioParagraph2: bioParagraph2 !== undefined ? bioParagraph2 : db.about?.bioParagraph2,
    metrics: metrics !== undefined ? metrics : db.about?.metrics,
    highlights: highlights !== undefined ? highlights : db.about?.highlights,
    skillCategories: skillCategories !== undefined ? skillCategories : db.about?.skillCategories
  };

  saveDb(db);
  return res.json({ success: true, about: db.about });
});

// Update Technical Arsenal / Skills specifically
app.put('/api/portfolio/skills', authenticateToken, (req, res) => {
  const db = getDb();
  const { skillCategories } = req.body;

  if (!Array.isArray(skillCategories)) {
    return res.status(400).json({ error: 'skillCategories must be an array.' });
  }

  db.about = db.about || {};
  db.about.skillCategories = skillCategories;

  saveDb(db);
  return res.json({ success: true, skillCategories: db.about.skillCategories, about: db.about });
});

// Update Contact & Settings
app.put('/api/portfolio/settings', authenticateToken, (req, res) => {
  const db = getDb();
  const { email, github, linkedin, twitter, availabilityStatus, availabilityLocation } = req.body;

  db.settings = {
    ...db.settings,
    email: email !== undefined ? email : db.settings?.email,
    github: github !== undefined ? github : db.settings?.github,
    linkedin: linkedin !== undefined ? linkedin : db.settings?.linkedin,
    twitter: twitter !== undefined ? twitter : db.settings?.twitter,
    availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : db.settings?.availabilityStatus,
    availabilityLocation: availabilityLocation !== undefined ? availabilityLocation : db.settings?.availabilityLocation
  };

  saveDb(db);
  return res.json({ success: true, settings: db.settings });
});

// Resume Management
app.post('/api/portfolio/resume', authenticateToken, upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was provided.' });
  }

  const db = getDb();
  const resumeUrl = `/uploads/${req.file.filename}`;

  db.resume = {
    activeResumeUrl: resumeUrl,
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    fileSizeBytes: req.file.size,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  return res.json({ success: true, resume: db.resume });
});

app.delete('/api/portfolio/resume', authenticateToken, (req, res) => {
  const db = getDb();
  db.resume = {
    activeResumeUrl: '/resume.pdf',
    filename: 'Default_Resume.pdf',
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  return res.json({ success: true, resume: db.resume });
});

// Server listener
app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
