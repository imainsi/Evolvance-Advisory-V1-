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
    // Email à l'équipe Evolvance
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Evolvance Advisory <contact@evolvance-advisory.com>',
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

    // Email de confirmation au visiteur
    const firstName = name.split(' ')[0];
    const confirmationHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for reaching out and for your interest in Evolvance Advisory.</p>
      <p>We've received your details and one of our team members will be in touch with you shortly. We look forward to learning more about your organization and exploring how we can help you navigate transformation and turn ambition into measurable value.</p>
      <p>In the meantime, feel free to reply to this email if you'd like to share any additional details about your project or priorities — we'd love to hear more.</p>
      <p>You can also explore our website at <a href="https://www.evolvance-advisory.com">evolvance-advisory.com</a> to learn more about our services and the industries we serve.</p>
      <p>Speak soon.</p>
      <p><strong>The Evolvance Advisory Team</strong><br><em>Turning Ambition into Measurable Value.</em></p>
      <hr>
      <p style="font-size:12px;color:#888;">This is an automated confirmation. A member of our team will follow up with you personally.</p>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Evolvance Advisory <contact@evolvance-advisory.com>',
        to: [email],
        reply_to: 'contact@evolvance-advisory.com',
        subject: 'Thank you for reaching out — Evolvance Advisory',
        html: confirmationHtml
      })
    });

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
