export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { loser, loserSeats, winnerSeats, winner } = req.body;

const prompt = `West Bengal 2026 election live count:
${winner}: ${winnerSeats} seats
${loser}: ${loserSeats} seats

Write EXACTLY ONE savage roast targeting ${loser} for losing badly.

Rules:
- Hinglish only (natural mix like "bhai", "yaar", "kya scene hai", etc.)
- Max 2 sentences (prefer 1 strong punchline)
- Street-style, meme-worthy, ruthless but funny (not political analysis)
- No explanations, no context, no hashtags
- Include 1–2 fitting emojis only
- Make it sound like a viral WhatsApp roast
- Avoid repetition or generic insults — be creative and specific to the situation

Output ONLY the roast.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(500).json({ error: 'No response from model' });
    res.status(200).json({ roast: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
