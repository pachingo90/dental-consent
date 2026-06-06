import { json, err, verifyAdminToken } from '../../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdminToken(request, env)) return err('Unauthorized', 401);

    const { id, name_zh, name_en, access_code } = await request.json();
    if (!id) return err('Missing clinic id');

    const fields = [];
    const values = [];
    if (name_zh)     { fields.push('name_zh = ?');     values.push(name_zh.trim()); }
    if (name_en !== undefined) { fields.push('name_en = ?'); values.push((name_en || '').trim()); }
    if (access_code) { fields.push('access_code = ?'); values.push(access_code.trim()); }

    if (!fields.length) return err('Nothing to update');
    values.push(id);

    await env.DB.prepare(
      `UPDATE clinics SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
