// 共用工具：token 驗證

const ADMIN_TOKEN_PREFIX = 'admin:';
const CLINIC_TOKEN_PREFIX = 'clinic:';

export function makeToken(type, id) {
  const payload = `${type}:${id}:${Date.now()}`;
  return btoa(payload);
}

export function parseToken(token) {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    return { type: parts[0], id: parts[1] };
  } catch {
    return null;
  }
}

export function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// 驗證診所 token，回傳 clinic_id 或 null
export async function verifyClinicToken(request, env) {
  const token = getToken(request);
  if (!token) return null;
  const parsed = parseToken(token);
  if (!parsed || parsed.type !== 'clinic') return null;
  // 確認診所仍然存在且啟用
  const clinic = await env.DB.prepare(
    'SELECT id FROM clinics WHERE id = ? AND active = 1'
  ).bind(parsed.id).first();
  return clinic ? parsed.id : null;
}

// 驗證管理員 token
export async function verifyAdminToken(request, env) {
  const token = getToken(request);
  if (!token) return false;
  const parsed = parseToken(token);
  if (!parsed || parsed.type !== 'admin') return false;
  // 比對儲存的管理員密碼 hash（用 KV 存）
  const stored = await env.DENTAL_KV.get('admin_token_valid:' + token);
  return stored === '1';
}
