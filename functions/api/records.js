export async function onRequestGet(context) {
  const { env } = context;

  try {
    const data = await env.DENTAL_KV.get('records');
    const records = data ? JSON.parse(data) : [];

    return new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
