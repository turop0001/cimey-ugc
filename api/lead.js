// Vercel serverless function: stores a consultation request in Vercel's Upstash Redis store and emails Cimey.
// Env vars (set by the Vercel Upstash integration): KV_REST_API_URL, KV_REST_API_TOKEN
// Optional for email: RESEND_API_KEY, NOTIFY_EMAIL
const clip = (v, n) => String(v || '').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch (e) { b = {}; }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot
  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    created: new Date().toISOString(),
    name: clip(b.name, 120), email: clip(b.email, 200), brand: clip(b.brand, 200),
    channel: clip(b.channel, 30), handle: clip(b.handle, 60), date: clip(b.date, 10), time: clip(b.time, 5),
    message: clip(b.message, 2000), status: 'Новая'
  };
  if (!lead.name || !lead.brand || !/^\S+@\S+\.\S+$/.test(lead.email) || !lead.date || !lead.time || b.consent !== true
    || (lead.channel !== 'Email' && lead.handle.length < 3))
    return res.status(400).json({ ok: false, error: 'invalid' });

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(500).json({ ok: false, error: 'not configured' });

  const db = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(['LPUSH', 'leads', JSON.stringify(lead)])
  }).catch(() => null);
  if (!db || !db.ok) return res.status(502).json({ ok: false, error: 'db' });

  if (process.env.RESEND_API_KEY) {
    const text = `New consultation request\n\nName: ${lead.name}\nEmail: ${lead.email}\n${lead.handle ? lead.channel + ': ' + lead.handle + '\n' : ''}Brand: ${lead.brand}\nReach via: ${lead.channel}\nWhen: ${lead.date} ${lead.time} WIB (UTC+7)\n\n${lead.message}`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Cimey UGC <onboarding@resend.dev>', to: [process.env.NOTIFY_EMAIL || 'cimeygallery@gmail.com'], reply_to: lead.email, subject: 'New lead: ' + lead.brand, text })
    }).catch(() => {});
  }
  return res.status(200).json({ ok: true });
};
