// Public: returns student reviews only when at least 5 have been approved in the CRM.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(200).json({ reviews: [] });
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(['GET', 'reviews_public']) }).catch(() => null);
  let list = []; try { list = JSON.parse((await r.json()).result || '[]'); } catch (e) {}
  res.status(200).json({ reviews: list.length >= 5 ? list : [] });
};
