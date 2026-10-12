// Public: launch settings for the course page (set from the CRM). Empty until the date is announced.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(200).json({});
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(['GET', 'group_cfg']) }).catch(() => null);
  let c = {}; try { c = JSON.parse((await r.json()).result || '{}'); } catch (e) {}
  res.status(200).json({ announced: c.announced || '', start: c.start || '', offerDays: c.offerDays || 5 });
};
