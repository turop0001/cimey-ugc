// Shared helpers for the guide email sequence (Resend + Upstash Redis REST).
const crypto = require('crypto');
const SITE = process.env.SITE_URL || 'https://cimey-ugc.vercel.app';

const redisCfg = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});
async function redis(cmd) {
  const { url, token } = redisCfg();
  if (!url || !token) return null;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) }).catch(() => null);
  if (!r || !r.ok) return null;
  return (await r.json()).result;
}
const secret = () => process.env.UNSUB_SECRET || process.env.RESEND_API_KEY || 'cimey';
const token = email => crypto.createHmac('sha256', secret()).update(String(email).toLowerCase()).digest('hex').slice(0, 24);
const unsubUrl = email => `${SITE}/api/unsub?e=${encodeURIComponent(email)}&t=${token(email)}`;

// day = days after signup. {name} is filled in per lead.
const SEQUENCE = [
  { n: 1, day: 0, subject: 'Your First Pitch Pack is here', text:
`Hi {name},

Here is your First Pitch Pack: {site}/downloads/first-pitch-pack.pdf

It has 5 pitch templates I use with brands, plus a tracker. Do this today: pick one brand you already like, fill in template 1 and send it. One message is enough to start.

If you tell me your niche (skincare, apps, travel, food), I will reply with one idea for your first video.

Cimey` },
  { n: 2, day: 2, subject: 'The 5 minute check before every pitch', text:
`Hi {name},

Most pitches get ignored because they could have been sent to anyone. Here is the check I do before I send mine:

1. Watch the brand's last 5 posts.
2. Write one sentence about who the product is for.
3. Open the Meta Ad Library and see if they already run video ads.
4. Choose one video from my portfolio that is close to their product.

It takes five minutes and changes how many people reply. The bonus list of platforms and ways to find brands is here: {site}/downloads/brand-hunt-list.pdf

Cimey` },
  { n: 3, day: 4, subject: '"Do I need followers?"', text:
`Hi {name},

This is the question I get most. You do not need followers to make UGC. Brands pay for the video file and post it on their own accounts and ads.

What you do need is 3 to 5 videos that show how you speak to the camera and how you explain a product. They can be about products you already use.

Reply with the first product you would film and I will send you a hook for it.

Cimey` },
  { n: 4, day: 6, subject: 'What $1,000 a month can look like', text:
`Hi {name},

Here is the math behind the goal: 5 brands at $200 a video is $1,000. Another version is 7 videos at $150 plus a few paid add-ons. You can move the numbers yourself in the calculator: {site}/course/#math

This is a goal, not a promise. How fast you get there depends on your niche, your hours and how many brands you contact.

I am opening a small group (8 people max) where I review your videos and pitches every week for 8 weeks. Details and price: {site}/course/#offer

Cimey` },
  { n: 5, day: 9, subject: 'The UGC group is opening soon: join the waitlist', closing: true, text:
`Hi {name},

I am opening a small UGC Creator Group (8 people max), and I keep the group small so I can watch every video you send.

There is no start date yet. If you join the waitlist now, you hear the date before anyone else, and you get a lower price for a few days after I announce it. Joining is free and you pay nothing until the date is set.

The waitlist takes two minutes: {site}/course/#apply
I read every entry myself and reply within 48 hours.

If the timing is wrong, the Pitch Pack is yours to keep. Good luck with your first pitches.

Cimey` }
];

function render(step, lead) {
  const name = (lead.name || '').split(' ')[0] || 'there';
  const f = s => s.replaceAll('{name}', name).replaceAll('{site}', SITE);
  return { subject: f(step.subject), text: f(step.text) + `\n\n--\nCimey UGC, Pekanbaru, Indonesia\nUnsubscribe: ${unsubUrl(lead.email)}` };
}
async function send(to, mail) {
  if (!process.env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM || 'Cimey UGC <onboarding@resend.dev>', to: [to], reply_to: process.env.NOTIFY_EMAIL || 'cimeygallery@gmail.com', subject: mail.subject, text: mail.text,
      headers: { 'List-Unsubscribe': `<${unsubUrl(to)}>` } })
  }).catch(() => null);
  return !!(r && r.ok);
}
module.exports = { SEQUENCE, render, send, redis, token, unsubUrl };
