import { json, err, verifyAdminToken } from '../../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdminToken(request, env)) return err('Unauthorized', 401);

    const { id, name_zh, name_en, access_code } = await request.json();
    if (!id || !name_zh || !access_code) return err('診所代碼、中文名稱、密碼為必填');

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanId) return err('診所代碼只能包含英文小寫、數字、連字號');

    // 檢查是否已存在
    const exists = await env.DB.prepare('SELECT id FROM clinics WHERE id = ?').bind(cleanId).first();
    if (exists) return err('診所代碼已存在');

    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO clinics (id, name_zh, name_en, access_code, active, created_at) VALUES (?, ?, ?, ?, 1, ?)'
    ).bind(cleanId, name_zh.trim(), (name_en || '').trim(), access_code.trim(), now).run();

    return json({ ok: true, id: cleanId });
  } catch (e) {
    return err(e.message, 500);
  }
}
