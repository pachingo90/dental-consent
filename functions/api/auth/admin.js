function makeToken(type, id) {
  return btoa(`${type}:${id}:${Date.now()}`);
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
function err(msg, status = 400) { return json({ error: msg }, status); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { password } = await request.json();
    if (!password) return err('Missing password');
    const stored = await env.DENTAL_KV.get('admin_password');
    if (!stored) return err('管理員尚未設定，請聯絡系統管理員', 403);
    if (password !== stored) return err('密碼錯誤', 401);
    const token = makeToken('admin', 'root');
    await env.DENTAL_KV.put('admin_token_valid:' + token, '1');
    return json({ ok: true, token });
  } catch (e) {
    return err(e.message, 500);
  }
}
