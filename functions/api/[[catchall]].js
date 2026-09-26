// Cloudflare Pages Function: /api/* handler
// Provides edge serverless execution for authentication and CMS APIs on Cloudflare Pages

const INITIAL_DB = {
  resume: {
    activeResumeUrl: "/resume.pdf",
    filename: "Shivam_Verma_Resume.pdf",
    updatedAt: "2026-09-26T17:48:00.000Z"
  },
  settings: {
    email: "csshivamverma54@gmail.com",
    github: "https://github.com/csshivamverma54",
    linkedin: "https://linkedin.com/in/shivamverma54",
    twitter: "",
    availabilityStatus: "Available for Q4 Projects",
    availabilityLocation: "Remote Worldwide • Contract or Full-Time"
  },
  about: {
    heading: "Building Intelligent Solutions with Data  & AI",
    subheading: "Computer Science Student • AI/ML Enthusiast • Data Science Learner ",
    bioTitle: "Turning Curiosity into Intelligent Solutions",
    bioParagraph1: "I’m a Computer Science student passionate about Artificial Intelligence, Machine Learning, and Data Science. I enjoy learning how technology works behind the scenes and turning what I learn into practical projects that solve real-world problems.",
    bioParagraph2: "My journey is focused on building strong foundations in Python, SQL, machine learning, data analytics, and modern development tools while continuously exploring new technologies. I believe in learning by building, experimenting, and improving with every project.",
    metrics: [
      { num: "5+", label: "Years of Craft" },
      { num: "10M+", label: "Daily Events" },
      { num: "60", label: "FPS Guarantee" }
    ],
    highlights: [
      {
        title: "60 FPS Ultra-Fluid Web Performance",
        desc: "Obsessed with sub-frame render times, memory optimization, and physics-driven interactive web craft."
      },
      {
        title: "Resilient Cloud & Distributed Architecture",
        desc: "Proven experience designing fault-tolerant backend microservices and streaming millions of events."
      },
      {
        title: "Pixel-Perfect Luxury Interface Design",
        desc: "Harmonizing sleek typography, tactile micro-interactions, and accessible glassmorphism standards."
      }
    ],
    skillCategories: [
      {
        category: "Frontend & Creative",
        skills: ["React", "Next.js", "TypeScript", "HTML5 Canvas API", "WebGL & Three.js", "Tailwind CSS", "CSS Architecture"]
      },
      {
        category: "Backend & Systems",
        skills: ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "GraphQL", "RESTful APIs", "Microservices"]
      },
      {
        category: "DevOps & Tooling",
        skills: ["Docker", "AWS / Cloudflare", "CI/CD Pipelines", "OpenCV / Media Processing", "Vite / Webpack", "Git"]
      }
    ]
  },
  projects: [
    {
      id: "canvas-engine",
      title: "Zero-Lag Canvas Interaction Engine",
      category: "Creative Web & Canvas Engine",
      description: "A bespoke 60 FPS angular cursor tracking engine with zero ghosting and shortest-path circular interpolation. Pre-extracts 64 synchronized WebP frames for instantaneous 35ms response time.",
      tags: ["React", "HTML5 Canvas", "OpenCV", "WebP", "Math / Trigonometry"],
      previewType: "canvas",
      link: "https://github.com",
      github: "https://github.com",
      status: "Live on this page",
      featured: true,
      sortOrder: 1
    },
    {
      id: "nexus-design",
      title: "Nexus Enterprise Design System",
      category: "Design Systems & Frontend",
      description: "An enterprise-grade component library featuring glassmorphic depth, spring physics animations, WCAG AAA accessibility, and automated token synchronization.",
      tags: ["TypeScript", "React", "Tailwind CSS", "Framer Motion", "Storybook"],
      previewType: "ui",
      link: "https://github.com",
      github: "https://github.com",
      status: "Open Source",
      featured: false,
      sortOrder: 3
    },
    {
      id: "omnisearch-ai",
      title: "OmniSearch Semantic Vector Index",
      category: "Full Stack & AI Systems",
      description: "Multi-modal search engine combining dense vector embeddings with inverted indexes to deliver sub-second semantic retrieval across vast documentation repositories.",
      tags: ["Python", "FastAPI", "FAISS", "Embeddings", "Next.js", "Tailwind"],
      previewType: "search",
      link: "https://github.com",
      github: "https://github.com",
      status: "Case Study",
      featured: false,
      sortOrder: 4
    }
  ]
};

// Global in-memory cache across worker invocation lifecycles
let memoryDb = null;

async function getDb(env) {
  if (env && env.PORTFOLIO_KV) {
    try {
      const raw = await env.PORTFOLIO_KV.get('portfolio_db');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('KV read error:', e);
    }
  }
  if (!memoryDb) {
    memoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
  }
  return memoryDb;
}

async function saveDb(data, env) {
  memoryDb = data;
  if (env && env.PORTFOLIO_KV) {
    try {
      await env.PORTFOLIO_KV.put('portfolio_db', JSON.stringify(data));
    } catch (e) {
      console.warn('KV write error:', e);
    }
  }
}

// Helpers for Web Crypto JWT
function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  let binarySig = '';
  const sigBytes = new Uint8Array(signature);
  for (let i = 0; i < sigBytes.length; i++) binarySig += String.fromCharCode(sigBytes[i]);
  const encodedSignature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJwt(token, secret) {
  try {
    const parts = (token || '').split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    let sigBase64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (sigBase64.length % 4) sigBase64 += '=';
    const binary = atob(sigBase64);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) sigBytes[i] = binary.charCodeAt(i);

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const jwtSecret = env.JWT_SECRET || (env.ADMIN_PASSWORD ? `${env.ADMIN_PASSWORD}_secure_key` : 'portfolio_edge_jwt_secret');

  async function authenticate() {
    const authHeader = request.headers.get('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    return await verifyJwt(match[1], jwtSecret);
  }

  // 1. PUBLIC: GET /api/portfolio
  if (method === 'GET' && pathname === '/api/portfolio') {
    const db = await getDb(env);
    const projects = (db.projects || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return jsonResponse({
      projects,
      about: db.about || {},
      settings: db.settings || {},
      resume: db.resume || { activeResumeUrl: '/resume.pdf' }
    });
  }

  // 2. AUTH: POST /api/auth/login
  if (method === 'POST' && pathname === '/api/auth/login') {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
    }

    const { email, password } = body;
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return jsonResponse({
        error: 'Admin credentials not configured in Cloudflare Environment Variables. Please set ADMIN_EMAIL and ADMIN_PASSWORD in your Cloudflare Pages project settings.'
      }, 503);
    }

    const emailMatches = email && typeof email === 'string' && email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const passMatches = password && typeof password === 'string' && timingSafeEqual(password, adminPassword);

    if (!emailMatches || !passMatches) {
      return jsonResponse({ error: 'Invalid admin credentials.' }, 401);
    }

    const token = await signJwt(
      { email: adminEmail, role: 'admin', exp: Math.floor(Date.now() / 1000) + 86400 * 7 },
      jwtSecret
    );

    return jsonResponse({
      success: true,
      token,
      user: { email: adminEmail, role: 'admin' }
    });
  }

  // 3. AUTH: GET /api/auth/me
  if (method === 'GET' && pathname === '/api/auth/me') {
    const user = await authenticate();
    if (!user) {
      return jsonResponse({ error: 'Unauthorized or token expired.' }, 401);
    }
    return jsonResponse({ user: { email: user.email, role: user.role } });
  }

  // 4. AUTH: POST /api/auth/logout
  if (method === 'POST' && pathname === '/api/auth/logout') {
    return jsonResponse({ success: true, message: 'Logged out successfully.' });
  }

  // 5. PROTECTED: Projects CRUD
  if (pathname.startsWith('/api/portfolio/projects')) {
    const user = await authenticate();
    if (!user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const db = await getDb(env);

    if (method === 'POST' && pathname === '/api/portfolio/projects') {
      const body = await request.json();
      const newProj = {
        id: `proj_${Date.now()}`,
        title: (body.title || '').trim(),
        category: body.category || 'Web Development',
        description: body.description || '',
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map(t => t.trim()) : []),
        previewType: body.previewType || 'canvas',
        link: body.link || '#',
        github: body.github || '#',
        status: body.status || 'Completed',
        featured: !!body.featured,
        sortOrder: (db.projects?.length || 0) + 1
      };

      db.projects = db.projects || [];
      db.projects.push(newProj);
      await saveDb(db, env);
      return jsonResponse({ success: true, project: newProj }, 201);
    }

    if (method === 'PUT' && pathname === '/api/portfolio/projects-reorder') {
      const { orderedIds } = await request.json();
      if (Array.isArray(orderedIds)) {
        const map = new Map((db.projects || []).map(p => [p.id, p]));
        const reordered = [];
        orderedIds.forEach((id, idx) => {
          if (map.has(id)) {
            const p = map.get(id);
            p.sortOrder = idx + 1;
            reordered.push(p);
            map.delete(id);
          }
        });
        for (const rem of map.values()) {
          rem.sortOrder = reordered.length + 1;
          reordered.push(rem);
        }
        db.projects = reordered;
        await saveDb(db, env);
      }
      return jsonResponse({ success: true, projects: db.projects });
    }

    const idMatch = pathname.match(/^\/api\/portfolio\/projects\/([^\/]+)$/);
    if (idMatch) {
      const projId = idMatch[1];
      const idx = (db.projects || []).findIndex(p => p.id === projId);

      if (method === 'PUT') {
        if (idx === -1) return jsonResponse({ error: 'Project not found.' }, 404);
        const body = await request.json();
        db.projects[idx] = {
          ...db.projects[idx],
          ...body,
          tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map(t => t.trim())) : db.projects[idx].tags,
          sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : db.projects[idx].sortOrder
        };
        await saveDb(db, env);
        return jsonResponse({ success: true, project: db.projects[idx] });
      }

      if (method === 'DELETE') {
        if (idx === -1) return jsonResponse({ error: 'Project not found.' }, 404);
        db.projects.splice(idx, 1);
        await saveDb(db, env);
        return jsonResponse({ success: true, message: 'Project removed.' });
      }
    }
  }

  // 6. PROTECTED: PUT /api/portfolio/skills
  if (method === 'PUT' && pathname === '/api/portfolio/skills') {
    const user = await authenticate();
    if (!user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const body = await request.json();
    if (!Array.isArray(body.skillCategories)) {
      return jsonResponse({ error: 'skillCategories must be an array.' }, 400);
    }

    const db = await getDb(env);
    db.about = db.about || {};
    db.about.skillCategories = body.skillCategories;
    await saveDb(db, env);
    return jsonResponse({ success: true, skillCategories: db.about.skillCategories, about: db.about });
  }

  // 7. PROTECTED: PUT /api/portfolio/about
  if (method === 'PUT' && pathname === '/api/portfolio/about') {
    const user = await authenticate();
    if (!user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const body = await request.json();
    const db = await getDb(env);
    db.about = {
      ...db.about,
      heading: body.heading !== undefined ? body.heading : db.about?.heading,
      subheading: body.subheading !== undefined ? body.subheading : db.about?.subheading,
      bioTitle: body.bioTitle !== undefined ? body.bioTitle : db.about?.bioTitle,
      bioParagraph1: body.bioParagraph1 !== undefined ? body.bioParagraph1 : db.about?.bioParagraph1,
      bioParagraph2: body.bioParagraph2 !== undefined ? body.bioParagraph2 : db.about?.bioParagraph2,
      metrics: body.metrics !== undefined ? body.metrics : db.about?.metrics,
      highlights: body.highlights !== undefined ? body.highlights : db.about?.highlights,
      skillCategories: body.skillCategories !== undefined ? body.skillCategories : db.about?.skillCategories
    };
    await saveDb(db, env);
    return jsonResponse({ success: true, about: db.about });
  }

  // 8. PROTECTED: PUT /api/portfolio/settings
  if (method === 'PUT' && pathname === '/api/portfolio/settings') {
    const user = await authenticate();
    if (!user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const body = await request.json();
    const db = await getDb(env);
    db.settings = {
      ...db.settings,
      ...body
    };
    await saveDb(db, env);
    return jsonResponse({ success: true, settings: db.settings });
  }

  // 9. PROTECTED: DELETE /api/portfolio/resume
  if (method === 'DELETE' && pathname === '/api/portfolio/resume') {
    const user = await authenticate();
    if (!user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const db = await getDb(env);
    db.resume = {
      activeResumeUrl: '/resume.pdf',
      filename: 'Shivam_Verma_Resume.pdf',
      updatedAt: new Date().toISOString()
    };
    await saveDb(db, env);
    return jsonResponse({ success: true, resume: db.resume });
  }

  return jsonResponse({ error: `Not found: ${method} ${pathname}` }, 404);
}

export async function onRequestGet(context) { return onRequest(context); }
export async function onRequestPost(context) { return onRequest(context); }
export async function onRequestPut(context) { return onRequest(context); }
export async function onRequestDelete(context) { return onRequest(context); }
export async function onRequestOptions(context) { return onRequest(context); }

