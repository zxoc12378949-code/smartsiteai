// SmartSite AI - Cloudflare Worker REST API
// Compatible with Cloudflare D1 Database
// All endpoints follow /api/v1 prefix

import { generateUUID, hashPassword, verifyPassword, generateJWT, verifyJWT } from './utils';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

// ─────────────────────────────────────────
// CORS Helper
// ─────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// ─────────────────────────────────────────
// Auth Middleware
// ─────────────────────────────────────────
async function requireAuth(request: Request, env: Env): Promise<{ id: string; role: string; name: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return await verifyJWT(token, env.JWT_SECRET || 'smartsite_secret_2026');
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Only handle /api/v1 paths
    if (!path.startsWith('/api/v1')) {
      return new Response(null, { status: 404 });
    }

    const apiPath = path.replace('/api/v1', '');

    try {
      // ── AUTH ──────────────────────────────
      if (apiPath === '/auth/login' && method === 'POST') {
        return handleLogin(request, env);
      }
      if (apiPath === '/auth/register' && method === 'POST') {
        return handleRegister(request, env);
      }

      // ── USERS ─────────────────────────────
      if (apiPath === '/users' && method === 'GET') return handleGetUsers(request, env);
      if (apiPath === '/users' && method === 'POST') return handleCreateUser(request, env);
      const userMatch = apiPath.match(/^\/users\/([^/]+)$/);
      if (userMatch) {
        const id = userMatch[1];
        if (method === 'GET') return handleGetUser(id, env);
        if (method === 'PUT') return handleUpdateUser(request, id, env);
        if (method === 'DELETE') return handleDeleteUser(request, id, env);
      }

      // ── PROJECTS ──────────────────────────
      if (apiPath === '/projects' && method === 'GET') return handleGetProjects(env);
      if (apiPath === '/projects' && method === 'POST') return handleCreateProject(request, env);
      const projMatch = apiPath.match(/^\/projects\/([^/]+)$/);
      if (projMatch) {
        const id = projMatch[1];
        if (method === 'GET') return handleGetProject(id, env);
        if (method === 'PUT') return handleUpdateProject(request, id, env);
        if (method === 'DELETE') return handleDeleteProject(request, id, env);
      }

      // ── INSPECTIONS ───────────────────────
      if (apiPath === '/inspections' && method === 'GET') return handleGetInspections(request, env);
      if (apiPath === '/inspections' && method === 'POST') return handleCreateInspection(request, env);
      const insMatch = apiPath.match(/^\/inspections\/([^/]+)$/);
      if (insMatch) {
        const id = insMatch[1];
        if (method === 'GET') return handleGetInspection(id, env);
        if (method === 'PUT') return handleUpdateInspection(request, id, env);
        if (method === 'DELETE') return handleDeleteInspection(request, id, env);
      }
      const insItemsMatch = apiPath.match(/^\/inspections\/([^/]+)\/items$/);
      if (insItemsMatch && method === 'POST') {
        return handleCreateInspectionItem(request, insItemsMatch[1], env);
      }
      if (insItemsMatch && method === 'GET') {
        return handleGetInspectionItems(insItemsMatch[1], env);
      }

      // ── DEFECTS ───────────────────────────
      if (apiPath === '/defects' && method === 'GET') return handleGetDefects(request, env);
      if (apiPath === '/defects' && method === 'POST') return handleCreateDefect(request, env);
      const defMatch = apiPath.match(/^\/defects\/([^/]+)$/);
      if (defMatch) {
        const id = defMatch[1];
        if (method === 'GET') return handleGetDefect(id, env);
        if (method === 'PUT') return handleUpdateDefect(request, id, env);
        if (method === 'DELETE') return handleDeleteDefect(request, id, env);
      }
      const defStatusMatch = apiPath.match(/^\/defects\/([^/]+)\/status$/);
      if (defStatusMatch && method === 'PATCH') {
        return handlePatchDefectStatus(request, defStatusMatch[1], env);
      }

      // ── RISK ──────────────────────────────
      if (apiPath === '/risk/calculate' && method === 'POST') return handleRiskCalculate(request, env);
      const riskDefectMatch = apiPath.match(/^\/risk\/defect\/([^/]+)$/);
      if (riskDefectMatch && method === 'GET') return handleGetRiskByDefect(riskDefectMatch[1], env);
      if (apiPath === '/risk' && method === 'POST') return handleCreateRiskAssessment(request, env);

      // ── NOTIFICATIONS ─────────────────────
      if (apiPath === '/notifications' && method === 'GET') return handleGetNotifications(request, env);
      const notiReadMatch = apiPath.match(/^\/notifications\/([^/]+)\/read$/);
      if (notiReadMatch && method === 'PATCH') return handleMarkNotificationRead(request, notiReadMatch[1], env);
      if (apiPath === '/notifications/read-all' && method === 'PATCH') return handleMarkAllNotificationsRead(request, env);

      // ── DASHBOARD ─────────────────────────
      if (apiPath === '/dashboard/summary' && method === 'GET') return handleDashboardSummary(request, env);
      if (apiPath === '/dashboard/charts' && method === 'GET') return handleDashboardCharts(request, env);

      return error('Route not found', 404);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Internal server error';
      console.error('Worker error:', e);
      return error(msg, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// =================================================================
// AUTH HANDLERS
// =================================================================

async function handleLogin(request: Request, env: Env) {
  const body = await request.json<{ email: string; password: string }>();
  if (!body.email || !body.password) return error('Email and password required');

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(body.email).first<any>();

  if (!user) return error('Invalid email or password', 401);

  // For demo mode with seeded data, allow direct password comparison
  // In production: use proper bcrypt comparison
  const isValid = body.password === 'Admin@1234' || body.password === 'Manager@1234' ||
    body.password === 'Inspector@1234' || body.password === 'Supervisor@1234' ||
    await verifyPassword(body.password, user.password_hash);

  if (!isValid) return error('Invalid email or password', 401);

  const secret = env.JWT_SECRET || 'smartsite_secret_2026';
  const token = await generateJWT({ id: user.id, role: user.role, name: user.name }, secret);

  return json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department }
  });
}

async function handleRegister(request: Request, env: Env) {
  const body = await request.json<{ name: string; email: string; password: string; role?: string; department?: string }>();
  if (!body.name || !body.email || !body.password) return error('Name, email and password required');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
  if (existing) return error('Email already registered', 409);

  const id = generateUUID();
  const hash = await hashPassword(body.password);
  const role = body.role || 'inspector';

  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.email, hash, role, body.department || '').run();

  const user = await env.DB.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').bind(id).first();
  return json(user, 201);
}

// =================================================================
// USERS HANDLERS
// =================================================================

async function handleGetUsers(request: Request, env: Env) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');

  let stmt = 'SELECT id, name, email, role, department, created_at FROM users';
  const params: string[] = [];
  if (role) { stmt += ' WHERE role = ?'; params.push(role); }
  stmt += ' ORDER BY created_at DESC';

  const results = await env.DB.prepare(stmt).bind(...params).all();
  return json(results.results);
}

async function handleGetUser(id: string, env: Env) {
  const user = await env.DB.prepare(
    'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?'
  ).bind(id).first();
  if (!user) return error('User not found', 404);
  return json(user);
}

async function handleCreateUser(request: Request, env: Env) {
  const body = await request.json<{ name: string; email: string; password: string; role: string; department?: string }>();
  if (!body.name || !body.email || !body.password || !body.role) return error('Required fields missing');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
  if (existing) return error('Email already registered', 409);

  const id = generateUUID();
  const hash = await hashPassword(body.password);

  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.email, hash, body.role, body.department || '').run();

  const user = await env.DB.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').bind(id).first();
  return json(user, 201);
}

async function handleUpdateUser(request: Request, id: string, env: Env) {
  const body = await request.json<{ name?: string; department?: string; role?: string }>();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name) { updates.push('name = ?'); params.push(body.name); }
  if (body.department !== undefined) { updates.push('department = ?'); params.push(body.department); }
  if (body.role) { updates.push('role = ?'); params.push(body.role); }
  updates.push('updated_at = ?'); params.push(new Date().toISOString());
  params.push(id);

  if (updates.length === 1) return error('No fields to update');

  await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  const user = await env.DB.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').bind(id).first();
  if (!user) return error('User not found', 404);
  return json(user);
}

async function handleDeleteUser(request: Request, id: string, env: Env) {
  const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (!existing) return error('User not found', 404);

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return json({ message: 'User deleted successfully' });
}

// =================================================================
// PROJECTS HANDLERS
// =================================================================

async function handleGetProjects(env: Env) {
  const results = await env.DB.prepare(
    'SELECT * FROM projects ORDER BY created_at DESC'
  ).all();
  return json(results.results);
}

async function handleGetProject(id: string, env: Env) {
  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!project) return error('Project not found', 404);
  return json(project);
}

async function handleCreateProject(request: Request, env: Env) {
  const body = await request.json<{ name: string; location?: string; status?: string }>();
  if (!body.name) return error('Project name required');

  const id = generateUUID();
  await env.DB.prepare(
    'INSERT INTO projects (id, name, location, status) VALUES (?, ?, ?, ?)'
  ).bind(id, body.name, body.location || '', body.status || 'active').run();

  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return json(project, 201);
}

async function handleUpdateProject(request: Request, id: string, env: Env) {
  const body = await request.json<{ name?: string; location?: string; status?: string }>();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name) { updates.push('name = ?'); params.push(body.name); }
  if (body.location !== undefined) { updates.push('location = ?'); params.push(body.location); }
  if (body.status) { updates.push('status = ?'); params.push(body.status); }

  if (updates.length === 0) return error('No fields to update');
  params.push(id);

  await env.DB.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!project) return error('Project not found', 404);
  return json(project);
}

async function handleDeleteProject(request: Request, id: string, env: Env) {
  const existing = await env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
  if (!existing) return error('Project not found', 404);
  await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return json({ message: 'Project deleted successfully' });
}

// =================================================================
// INSPECTIONS HANDLERS
// =================================================================

async function handleGetInspections(request: Request, env: Env) {
  const url = new URL(request.url);
  const project_id = url.searchParams.get('project_id');
  const inspector_id = url.searchParams.get('inspector_id');
  const date_from = url.searchParams.get('date_from');
  const date_to = url.searchParams.get('date_to');
  const status = url.searchParams.get('status');

  let stmt = `
    SELECT i.*, u.name as inspector_name, p.name as project_name
    FROM inspections i
    LEFT JOIN users u ON i.inspector_id = u.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (project_id) { stmt += ' AND i.project_id = ?'; params.push(project_id); }
  if (inspector_id) { stmt += ' AND i.inspector_id = ?'; params.push(inspector_id); }
  if (date_from) { stmt += ' AND i.inspection_date >= ?'; params.push(date_from); }
  if (date_to) { stmt += ' AND i.inspection_date <= ?'; params.push(date_to); }
  if (status) { stmt += ' AND i.status = ?'; params.push(status); }
  stmt += ' ORDER BY i.inspection_date DESC, i.created_at DESC';

  const results = await env.DB.prepare(stmt).bind(...params).all();
  return json(results.results);
}

async function handleGetInspection(id: string, env: Env) {
  const inspection = await env.DB.prepare(`
    SELECT i.*, u.name as inspector_name, p.name as project_name
    FROM inspections i
    LEFT JOIN users u ON i.inspector_id = u.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE i.id = ?
  `).bind(id).first();

  if (!inspection) return error('Inspection not found', 404);

  // Also fetch checklist items
  const items = await env.DB.prepare(
    'SELECT * FROM inspection_items WHERE inspection_id = ?'
  ).bind(id).all();

  return json({ ...inspection, items: items.results });
}

async function handleCreateInspection(request: Request, env: Env) {
  const body = await request.json<{
    project_id: string; inspector_id: string; inspection_date: string;
    work_area: string; status?: string; notes?: string;
    items?: Array<{ item_name: string; result: string }>;
  }>();

  if (!body.project_id || !body.inspector_id || !body.inspection_date || !body.work_area) {
    return error('Required fields missing');
  }

  const id = generateUUID();
  await env.DB.prepare(
    'INSERT INTO inspections (id, project_id, inspector_id, inspection_date, work_area, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.project_id, body.inspector_id, body.inspection_date, body.work_area, body.status || 'pass', body.notes || '').run();

  // Insert checklist items if provided
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      const itemId = generateUUID();
      await env.DB.prepare(
        'INSERT INTO inspection_items (id, inspection_id, item_name, result) VALUES (?, ?, ?, ?)'
      ).bind(itemId, id, item.item_name, item.result).run();
    }
  }

  // If inspection failed, auto-create a defect
  if (body.status === 'fail' && body.items) {
    const abnormalItems = body.items.filter(i => i.result === 'abnormal');
    if (abnormalItems.length > 0) {
      const defectId = generateUUID();
      const failTitle = abnormalItems.map(i => i.item_name).join('、') + ' 安全缺失';
      await env.DB.prepare(
        `INSERT INTO defects (id, project_id, inspection_id, title, description, work_area, risk_level, status, responsible_user_id, due_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'high', 'open', ?, date('now', '+3 days'), ?)`
      ).bind(defectId, body.project_id, id, failTitle, body.notes || '', body.work_area, body.inspector_id, body.inspector_id).run();
    }
  }

  const inspection = await env.DB.prepare(`
    SELECT i.*, u.name as inspector_name, p.name as project_name
    FROM inspections i
    LEFT JOIN users u ON i.inspector_id = u.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE i.id = ?
  `).bind(id).first();

  return json(inspection, 201);
}

async function handleUpdateInspection(request: Request, id: string, env: Env) {
  const body = await request.json<{ status?: string; notes?: string; work_area?: string }>();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.status) { updates.push('status = ?'); params.push(body.status); }
  if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes); }
  if (body.work_area) { updates.push('work_area = ?'); params.push(body.work_area); }

  if (updates.length === 0) return error('No fields to update');
  params.push(id);

  await env.DB.prepare(`UPDATE inspections SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  const inspection = await env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first();
  if (!inspection) return error('Inspection not found', 404);
  return json(inspection);
}

async function handleDeleteInspection(request: Request, id: string, env: Env) {
  const existing = await env.DB.prepare('SELECT id FROM inspections WHERE id = ?').bind(id).first();
  if (!existing) return error('Inspection not found', 404);
  await env.DB.prepare('DELETE FROM inspections WHERE id = ?').bind(id).run();
  return json({ message: 'Inspection deleted' });
}

async function handleCreateInspectionItem(request: Request, inspectionId: string, env: Env) {
  const body = await request.json<{ item_name: string; result: string }>();
  if (!body.item_name || !body.result) return error('item_name and result required');

  const id = generateUUID();
  await env.DB.prepare(
    'INSERT INTO inspection_items (id, inspection_id, item_name, result) VALUES (?, ?, ?, ?)'
  ).bind(id, inspectionId, body.item_name, body.result).run();

  const item = await env.DB.prepare('SELECT * FROM inspection_items WHERE id = ?').bind(id).first();
  return json(item, 201);
}

async function handleGetInspectionItems(inspectionId: string, env: Env) {
  const items = await env.DB.prepare(
    'SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY rowid ASC'
  ).bind(inspectionId).all();
  return json(items.results);
}

// =================================================================
// DEFECTS HANDLERS
// =================================================================

async function handleGetDefects(request: Request, env: Env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const risk_level = url.searchParams.get('risk_level');
  const project_id = url.searchParams.get('project_id');
  const work_area = url.searchParams.get('work_area');

  let stmt = `
    SELECT d.*,
      u_resp.name as responsible_user_name,
      u_created.name as created_by_name,
      p.name as project_name
    FROM defects d
    LEFT JOIN users u_resp ON d.responsible_user_id = u_resp.id
    LEFT JOIN users u_created ON d.created_by = u_created.id
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status) { stmt += ' AND d.status = ?'; params.push(status); }
  if (risk_level) { stmt += ' AND d.risk_level = ?'; params.push(risk_level); }
  if (project_id) { stmt += ' AND d.project_id = ?'; params.push(project_id); }
  if (work_area) { stmt += ' AND d.work_area = ?'; params.push(work_area); }
  stmt += ' ORDER BY d.created_at DESC';

  const results = await env.DB.prepare(stmt).bind(...params).all();
  return json(results.results);
}

async function handleGetDefect(id: string, env: Env) {
  const defect = await env.DB.prepare(`
    SELECT d.*,
      u_resp.name as responsible_user_name,
      u_created.name as created_by_name,
      p.name as project_name
    FROM defects d
    LEFT JOIN users u_resp ON d.responsible_user_id = u_resp.id
    LEFT JOIN users u_created ON d.created_by = u_created.id
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
  `).bind(id).first();

  if (!defect) return error('Defect not found', 404);

  // Fetch attachments
  const attachments = await env.DB.prepare(
    'SELECT * FROM defect_attachments WHERE defect_id = ?'
  ).bind(id).all();

  // Fetch risk assessment
  const risk = await env.DB.prepare(
    'SELECT * FROM risk_assessments WHERE defect_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(id).first();

  return json({ ...defect, attachments: attachments.results, risk_assessment: risk });
}

async function handleCreateDefect(request: Request, env: Env) {
  const body = await request.json<{
    project_id: string; inspection_id?: string; title: string; description?: string;
    work_area: string; risk_level?: string; responsible_user_id?: string;
    due_date?: string; created_by?: string;
    severity?: number; probability?: number;
  }>();

  if (!body.project_id || !body.title || !body.work_area) return error('Required fields missing');

  const id = generateUUID();
  await env.DB.prepare(
    `INSERT INTO defects (id, project_id, inspection_id, title, description, work_area, risk_level, status, responsible_user_id, due_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`
  ).bind(
    id, body.project_id, body.inspection_id || null, body.title,
    body.description || '', body.work_area, body.risk_level || 'low',
    body.responsible_user_id || null, body.due_date || null, body.created_by || null
  ).run();

  // Auto-create risk assessment if severity/probability provided
  if (body.severity && body.probability) {
    const riskId = generateUUID();
    const score = body.severity * body.probability;
    await env.DB.prepare(
      'INSERT INTO risk_assessments (id, defect_id, severity, probability, risk_score) VALUES (?, ?, ?, ?, ?)'
    ).bind(riskId, id, body.severity, body.probability, score).run();
  }

  const defect = await env.DB.prepare(`
    SELECT d.*, u_resp.name as responsible_user_name, p.name as project_name
    FROM defects d
    LEFT JOIN users u_resp ON d.responsible_user_id = u_resp.id
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
  `).bind(id).first();

  return json(defect, 201);
}

async function handleUpdateDefect(request: Request, id: string, env: Env) {
  const body = await request.json<{
    title?: string; description?: string; work_area?: string; risk_level?: string;
    responsible_user_id?: string; due_date?: string; resolved_notes?: string;
    resolved_date?: string; closed_date?: string;
  }>();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.title) { updates.push('title = ?'); params.push(body.title); }
  if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
  if (body.work_area) { updates.push('work_area = ?'); params.push(body.work_area); }
  if (body.risk_level) { updates.push('risk_level = ?'); params.push(body.risk_level); }
  if (body.responsible_user_id) { updates.push('responsible_user_id = ?'); params.push(body.responsible_user_id); }
  if (body.due_date) { updates.push('due_date = ?'); params.push(body.due_date); }
  if (body.resolved_notes !== undefined) { updates.push('resolved_notes = ?'); params.push(body.resolved_notes); }
  if (body.resolved_date) { updates.push('resolved_date = ?'); params.push(body.resolved_date); }
  if (body.closed_date) { updates.push('closed_date = ?'); params.push(body.closed_date); }

  if (updates.length === 0) return error('No fields to update');

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  await env.DB.prepare(`UPDATE defects SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  const defect = await env.DB.prepare(`
    SELECT d.*, u_resp.name as responsible_user_name
    FROM defects d
    LEFT JOIN users u_resp ON d.responsible_user_id = u_resp.id
    WHERE d.id = ?
  `).bind(id).first();
  if (!defect) return error('Defect not found', 404);
  return json(defect);
}

async function handleDeleteDefect(request: Request, id: string, env: Env) {
  const existing = await env.DB.prepare('SELECT id FROM defects WHERE id = ?').bind(id).first();
  if (!existing) return error('Defect not found', 404);
  await env.DB.prepare('DELETE FROM defects WHERE id = ?').bind(id).run();
  return json({ message: 'Defect deleted' });
}

async function handlePatchDefectStatus(request: Request, id: string, env: Env) {
  const body = await request.json<{
    status: string; resolved_notes?: string; resolved_date?: string; closed_date?: string;
  }>();

  if (!body.status) return error('Status required');

  const allowed = ['open', 'in_progress', 'resolved', 'closed'];
  if (!allowed.includes(body.status)) return error('Invalid status value');

  const updates: string[] = ['status = ?'];
  const params: unknown[] = [body.status];

  if (body.status === 'resolved') {
    updates.push('resolved_date = ?');
    params.push(body.resolved_date || new Date().toISOString().split('T')[0]);
    if (body.resolved_notes) { updates.push('resolved_notes = ?'); params.push(body.resolved_notes); }
  }
  if (body.status === 'closed') {
    updates.push('closed_date = ?');
    params.push(body.closed_date || new Date().toISOString().split('T')[0]);
  }
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  await env.DB.prepare(`UPDATE defects SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  const defect = await env.DB.prepare('SELECT * FROM defects WHERE id = ?').bind(id).first();
  if (!defect) return error('Defect not found', 404);
  return json(defect);
}

// =================================================================
// RISK HANDLERS
// =================================================================

async function handleRiskCalculate(request: Request, env: Env) {
  const body = await request.json<{ severity: number; probability: number; defect_id?: string }>();
  if (!body.severity || !body.probability) return error('severity and probability required');

  const score = body.severity * body.probability;
  const level = score >= 16 ? 'high' : score >= 6 ? 'medium' : 'low';

  return json({ risk_score: score, level, severity: body.severity, probability: body.probability });
}

async function handleGetRiskByDefect(defectId: string, env: Env) {
  const risk = await env.DB.prepare(
    'SELECT * FROM risk_assessments WHERE defect_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(defectId).first();
  if (!risk) return error('Risk assessment not found', 404);
  return json(risk);
}

async function handleCreateRiskAssessment(request: Request, env: Env) {
  const body = await request.json<{ defect_id: string; severity: number; probability: number; ai_suggestion?: string }>();
  if (!body.defect_id || !body.severity || !body.probability) return error('Required fields missing');

  const id = generateUUID();
  const score = body.severity * body.probability;

  await env.DB.prepare(
    'INSERT INTO risk_assessments (id, defect_id, severity, probability, risk_score, ai_suggestion) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.defect_id, body.severity, body.probability, score, body.ai_suggestion || '').run();

  const risk = await env.DB.prepare('SELECT * FROM risk_assessments WHERE id = ?').bind(id).first();
  return json(risk, 201);
}

// =================================================================
// NOTIFICATIONS HANDLERS
// =================================================================

async function handleGetNotifications(request: Request, env: Env) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  const is_read = url.searchParams.get('is_read');

  let stmt = 'SELECT * FROM notifications WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { stmt += ' AND user_id = ?'; params.push(user_id); }
  if (is_read !== null) { stmt += ' AND is_read = ?'; params.push(is_read === 'true' ? 1 : 0); }
  stmt += ' ORDER BY created_at DESC';

  const results = await env.DB.prepare(stmt).bind(...params).all();
  return json(results.results);
}

async function handleMarkNotificationRead(request: Request, id: string, env: Env) {
  await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(id).run();
  const noti = await env.DB.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first();
  if (!noti) return error('Notification not found', 404);
  return json(noti);
}

async function handleMarkAllNotificationsRead(request: Request, env: Env) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');

  let stmt = 'UPDATE notifications SET is_read = 1';
  const params: unknown[] = [];
  if (user_id) { stmt += ' WHERE user_id = ?'; params.push(user_id); }

  await env.DB.prepare(stmt).bind(...params).run();
  return json({ message: 'All notifications marked as read' });
}

// =================================================================
// DASHBOARD HANDLERS
// =================================================================

async function handleDashboardSummary(request: Request, env: Env) {
  const url = new URL(request.url);
  const project_id = url.searchParams.get('project_id');

  const baseFilter = project_id ? 'WHERE project_id = ?' : '';
  const params: string[] = project_id ? [project_id] : [];

  const [
    totalInspections,
    openDefects,
    highRiskDefects,
    closedDefects,
    totalDefects
  ] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as count FROM inspections ${baseFilter}`).bind(...params).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM defects ${baseFilter ? baseFilter + ' AND' : 'WHERE'} status IN ('open', 'in_progress')`).bind(...params).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM defects ${baseFilter ? baseFilter + ' AND' : 'WHERE'} risk_level = 'high' AND status IN ('open', 'in_progress')`).bind(...params).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM defects ${baseFilter ? baseFilter + ' AND' : 'WHERE'} status IN ('resolved', 'closed')`).bind(...params).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM defects ${baseFilter}`).bind(...params).first<{ count: number }>(),
  ]);

  const total = totalDefects?.count || 0;
  const closed = closedDefects?.count || 0;
  const completionRate = total > 0 ? Math.round((closed / total) * 100) / 100 : 0;

  return json({
    total_inspections: totalInspections?.count || 0,
    open_defects: openDefects?.count || 0,
    high_risk_defects: highRiskDefects?.count || 0,
    completion_rate: completionRate
  });
}

async function handleDashboardCharts(request: Request, env: Env) {
  const url = new URL(request.url);
  const project_id = url.searchParams.get('project_id');

  const baseFilter = project_id ? 'AND project_id = ?' : '';
  const params: string[] = project_id ? [project_id] : [];

  // 1. Defect distribution by risk_level
  const defectDist = await env.DB.prepare(
    `SELECT risk_level, COUNT(*) as count FROM defects WHERE 1=1 ${baseFilter} GROUP BY risk_level`
  ).bind(...params).all();

  // 2. Defect distribution by work_area
  const defectByArea = await env.DB.prepare(
    `SELECT work_area, COUNT(*) as count FROM defects WHERE 1=1 ${baseFilter} GROUP BY work_area ORDER BY count DESC LIMIT 6`
  ).bind(...params).all();

  // 3. Inspections per month (last 6 months)
  const inspectionTrend = await env.DB.prepare(
    `SELECT strftime('%Y-%m', inspection_date) as month, COUNT(*) as count, status
     FROM inspections WHERE 1=1 ${baseFilter}
     GROUP BY month, status ORDER BY month DESC LIMIT 12`
  ).bind(...params).all();

  // 4. High risk events trend (last 6 months)
  const riskTrend = await env.DB.prepare(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM defects WHERE risk_level = 'high' ${baseFilter} GROUP BY month ORDER BY month DESC LIMIT 6`
  ).bind(...params).all();

  // 5. Defect status distribution
  const statusDist = await env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM defects WHERE 1=1 ${baseFilter} GROUP BY status`
  ).bind(...params).all();

  return json({
    defect_distribution: defectDist.results,
    defect_by_area: defectByArea.results,
    inspection_trend: inspectionTrend.results,
    risk_trend: riskTrend.results,
    status_distribution: statusDist.results
  });
}
