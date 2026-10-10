const { redis, token } = require('./_mail');
module.exports = async (req, res) => {
  const e = String(req.query.e || '').toLowerCase(), t = String(req.query.t || '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!e || t !== token(e)) return res.status(400).send('<p style="font-family:sans-serif">This link is not valid.</p>');
  await redis(['SADD', 'unsub', e]);
  res.status(200).send('<body style="font-family:system-ui,sans-serif;background:#1a0a14;color:#fff;display:grid;place-items:center;height:100vh;margin:0"><div><h2>You are unsubscribed</h2><p>You will not get more emails from Cimey UGC.</p></div></body>');
};
