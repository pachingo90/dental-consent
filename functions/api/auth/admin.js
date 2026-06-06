import { json, err, makeToken } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { password } = await request.json();
    if (!password) return err('Missing password');

    // 管理員密碼存在 KV
    const stored = await env.DENTAL_KV.get('admin_password');
    if (!stored) return err('管理員尚未設定，請聯絡系統管理員', 403);
    if (password !== stored) return err('密碼錯誤', 401);

    const token = makeToken('admin', 'root');
    // 將 token 標記為有效（存 KV，永久有效）
    await env.DENTAL_KV.put('admin_token_valid:' + token, '1');
    return json({ ok: true, token });
  } catch (e) {
    return err(e.message, 500);
  }
}
