// /api/send-estimate.js — Vercel/Next.js style serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const data = await parseJSON(req);
    const { name, phone, email, address, message } = data || {};
    if (!name || !phone) return res.status(400).json({ error: 'name & phone required' });

    const from = 'info@enduraroofing.ca';     // verified Postmark sender
    const toInternal = 'info@enduraroofing.ca';
    const replyTo = email || undefined;

    await pmSend(process.env.POSTMARK_TOKEN, {
      From: from,
      To: toInternal,
      ReplyTo: replyTo,
      MessageStream: 'outbound',
      Subject: `New Estimate Request — ${name}`,
      TextBody: [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email || ''}`,
        `Address: ${address || ''}`,
        '',
        `Details: ${message || ''}`
      ].join('\n'),
      HtmlBody: `
        <h2>New Estimate Request</h2>
        <p><strong>Name:</strong> ${escapeHTML(name)}</p>
        <p><strong>Phone:</strong> ${escapeHTML(phone)}</p>
        <p><strong>Email:</strong> ${escapeHTML(email || '')}</p>
        <p><strong>Address:</strong> ${escapeHTML(address || '')}</p>
        <p><strong>Details:</strong><br>${escapeHTML(message || '').replace(/\n/g,'<br>')}</p>
      `
    });

    if (email) {
      await pmSend(process.env.POSTMARK_TOKEN, {
        From: from,
        To: email,
        ReplyTo: toInternal,
        MessageStream: 'outbound',
        Subject: 'We received your estimate request',
        TextBody: `Thanks ${name}! We received your request and will call you shortly at ${phone}.`,
        HtmlBody: `<p>Thanks ${escapeHTML(name)}! We received your request and will call you shortly at <strong>${escapeHTML(phone)}</strong>.</p>`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'send_failed' });
  }
}

async function pmSend(token, payload){
  if(!token) throw new Error('Missing POSTMARK_TOKEN env var');
  const r = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const text = await r.text().catch(()=>'');
    throw new Error(`Postmark error ${r.status}: ${text}`);
  }
}

function escapeHTML(s=''){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function parseJSON(req){
  return new Promise((resolve,reject)=>{
    let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ try{ resolve(JSON.parse(b||'{}')); }catch(e){ reject(e); }});
  });
}
