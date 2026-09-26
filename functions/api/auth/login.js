// Cloudflare Pages Function: POST /api/auth/login

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON request payload.' }, 400);
  }

  const { email, password } = body;
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return jsonResponse({
      error: 'ADMIN_EMAIL and ADMIN_PASSWORD are not configured. Please set them in your Cloudflare Pages Project Settings -> Environment variables.'
    }, 503);
  }

  const emailMatches = email && typeof email === 'string' && email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passMatches = password && typeof password === 'string' && timingSafeEqual(password, adminPassword);

  if (!emailMatches || !passMatches) {
    return jsonResponse({ error: 'Invalid admin email or password.' }, 401);
  }

  const jwtSecret = env.JWT_SECRET || (adminPassword ? `${adminPassword}_secure_salt` : 'portfolio_jwt_secret');

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
