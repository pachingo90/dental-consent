import { json, err, verifyAdminToken } from '../../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdminToken(request, env)) return err('Unauthorized', 401);

    const { new_password } = await request.json();
    if (!new_password || new_password.length < 6) return err('密碼至少需要 6 個字元');

    await env.DENTAL_KV.put('admin_password', new_password);

    // 清除所有舊的 admin token（強制重新登入）
    const oldToken = request.headers.get('Authorization')?.slice(7);
    if (oldToken) await env.DENTAL_KV.delete('admin_token_valid:' + oldToken);

    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
