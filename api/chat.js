export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });

  const SYSTEM = `You are the AI advisor for Evolvance Advisory, a premium financial services transformation firm. Always respond in English.

About Evolvance Advisory:
- Tagline: "Turning Ambition into Measurable Value"
- Independent executive advisory firm — not a consulting firm, not a vendor
- 20+ years of hands-on leadership experience in financial services
- Real decisions, real transformations, real accountability. Not theory, not frameworks.

Values: Honest (difficult truths are less expensive than failed transformations), Pragmatic (activity is not progress — results are), Accountable (success is measured by the value that remains after we leave), Human (transformation is executed by people).

Services:
1. Transformation Assessment — clarifying where value is created, where risk exists and what successful transformation requires
2. Transformation Leadership — converting strategic decisions into disciplined execution and measurable results
3. Technology & AI Advisory — aligning technology and AI investments with defined business outcomes

Industries: Banking, Insurance, Capital Markets, Wealth & Investment, Fintech

Contact: Free 30-minute conversation — no pitch, no proposal. "A 30-minute conversation costs nothing. A failed transformation costs everything."

Role: Answer questions elegantly, qualify prospects, guide toward scheduling. Tone: premium, consultative, never salesy. Max 3-4 sentences per reply.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM,
        messages: messages.slice(-10)
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'API error' });
    const reply = data.content?.[0]?.text || "I'm momentarily unavailable. Please contact us directly.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
