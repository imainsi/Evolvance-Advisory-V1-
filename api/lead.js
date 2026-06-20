export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, company, email, conversation } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing name or email' });

  // Résumé lisible de la conversation
  const transcript = Array.isArray(conversation)
    ? conversation.map(m => `${m.role === 'user' ? 'Visitor' : 'AI Advisor'}: ${m.content}`).join('\n\n')
    : 'No conversation history.';

  const htmlBody = `
    <h2>New lead from AI Advisor — ${escapeHtml(name)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Company:</strong> ${escapeHtml(company || 'Not provided')}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <hr>
    <h3>Conversation transcript</h3>
    <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:13px;">${escapeHtml(transcript)}</pre>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Evolvance AI Advisor <onboarding@resend.dev>',
        to: ['contact@evolvance-advisory.com'],
        reply_to: email,
        subject: `New lead from AI advisor — ${name}${company ? ' (' + company + ')' : ''}`,
        html: htmlBody
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Resend error:', errData);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
