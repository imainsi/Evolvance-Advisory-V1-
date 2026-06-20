export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });

  const SYSTEM = `You are the AI advisor for Evolvance Advisory, a premium financial services transformation firm. Always respond in English.
Tagline: "Turning Ambition into Measurable Value." 20+ years of combined executive leadership in financial services.
Values: Honest, Pragmatic, Accountable, Hands-On.
Services: 1) Transformation Assessment 2) Transformation Leadership 3) Technology & AI Advisory.
Industries: Banking, Insurance, Capital Markets, Wealth & Investment, Fintech.
Contact: Free 30-min conversation — no pitch, no proposal.
Role: Answer questions elegantly, qualify prospects, guide toward scheduling. Tone: premium, consultative, never salesy. Max 3-4 sentences.

LEAD CAPTURE: When the user shows genuine buying interest — mentions their company name, asks to schedule a call, asks about pricing/budget, or asks how to get in touch — end your reply with the exact tag [[SHOW_LEAD_FORM]] on its own, after your normal message, to trigger a contact form (name, company, email). Only use this tag once per conversation. Do not mention the tag itself or explain it to the user — it is invisible to them and only triggers the form.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: SYSTEM, messages: messages.slice(-10) })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'API error' });
    const reply = data.content?.[0]?.text || "I'm momentarily unavailable. Please contact us directly.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
