import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Schemas
const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Web Development' },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] },
  previewType: { type: String, default: 'canvas' },
  link: { type: String, default: '#' },
  github: { type: String, default: '#' },
  status: { type: String, default: 'Completed' },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const AboutSchema = new mongoose.Schema({
  heading: String,
  subheading: String,
  heroBio: String,
  principlesTitle: String,
  bioTitle: String,
  bioParagraph1: String,
  bioParagraph2: String,
  metrics: [{ num: String, label: String }],
  highlights: [{ title: String, desc: String }],
  skillCategories: [{
    category: String,
    skills: [String]
  }]
}, { timestamps: true });

const SettingsSchema = new mongoose.Schema({
  email: String,
  github: String,
  linkedin: String,
  twitter: String,
  availabilityStatus: String,
  availabilityLocation: String
}, { timestamps: true });

const ResumeSchema = new mongoose.Schema({
  activeResumeUrl: { type: String, default: '/resume.pdf' },
  filename: { type: String, default: 'Shivam_Verma_Resume.pdf' },
  storedFilename: String,
  fileSizeBytes: Number,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const About = mongoose.models.About || mongoose.model('About', AboutSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export const Resume = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);

let isConnected = false;

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] No MONGODB_URI found in environment. Using local db.json.');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    isConnected = true;
    console.log('[MongoDB] Connected successfully to MongoDB Atlas!');
    await seedInitialData();
    return true;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// Seed initial data from db.json if collections are empty
async function seedInitialData() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const local = JSON.parse(raw);

    // Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0 && local.projects?.length > 0) {
      await Project.insertMany(local.projects);
      console.log(`[MongoDB] Seeded ${local.projects.length} projects to MongoDB.`);
    }

    // About
    const aboutCount = await About.countDocuments();
    if (aboutCount === 0 && local.about) {
      await About.create(local.about);
      console.log('[MongoDB] Seeded About section to MongoDB.');
    }

    // Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0 && local.settings) {
      await Settings.create(local.settings);
      console.log('[MongoDB] Seeded Settings to MongoDB.');
    }

    // Resume
    const resumeCount = await Resume.countDocuments();
    if (resumeCount === 0 && local.resume) {
      await Resume.create(local.resume);
      console.log('[MongoDB] Seeded Resume metadata to MongoDB.');
    }
  } catch (err) {
    console.warn('[MongoDB] Seeding notice:', err.message);
  }
}
