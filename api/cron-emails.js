// Daily job (see vercel.json). Sends the next step of the guide sequence to each subscriber who is due.
// Needs env: RESEND_API_KEY, CRON_SECRET (Vercel adds it to cron requests). Safe to run twice: each step is sent once per lead.
const { SEQUENCE, render, send, redis } = require('./_mail');
module.exports = async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return res.status(401).json({ ok: false });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, skipped: 'RESEND_API_KEY not set' });
  const raw = (await redis(['LRANGE', 'leads', 0, 499])) || [];
  const leads = raw.map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(l => l && l.type === 'guide' && l.email);
  const now = Date.now(); let sent = 0;
  for (const l of leads) {
    if (await redis(['SISMEMBER', 'unsub', l.email.toLowerCase()])) continue;
    const age = (now - new Date(l.created).getTime()) / 864e5;
    for (const step of SEQUENCE) {
      if (age < step.day) continue;
      if (step.closing && age > step.day + 6) continue;          // do not send a stale closing reminder
      const key = `mail:${l.id}:${step.n}`;
      const fresh = await redis(['SET', key, '1', 'NX']);
      if (!fresh) continue;
      const ok = await send(l.email, render(step, l));
      if (!ok) { await redis(['DEL', key]); continue; }
      sent++;
    }
  }
  res.status(200).json({ ok: true, sent });
};
