export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { loser, loserSeats, winnerSeats, winner } = req.body;

const prompt = `West Bengal 2026 election live count:
${winner}: ${winnerSeats} seats
${loser}: ${loserSeats} seats

Write EXACTLY ONE insanely savage, unhinged Gen-Z Hinglish roast targeting ${loser} for losing badly.

Rules:
- Hinglish only (chaotic mix: "bhai", "bro", "yaar", "scene kya hai", "literally", "bhai tu theek hai?", etc.)
- Max 2 sentences (1 deadly punchline preferred)
- Tone: unfiltered Instagram comment section + dark sarcasm + meme energy
- Make it feel like public humiliation: hype vs reality, overconfidence collapse, "career finished" vibe
- Add Gen-Z slang like: "bro got ratio’d", "main character se side NPC ban gaya", "system hang ho gaya", etc.
- Use 2–4 emojis max (💀😂🔥🤡😭)
- Fast-paced, punchy, screenshot-worthy
- No hate speech, no threats, no targeting communities — roast only the loss/performance
- Avoid boring/generic lines — make it feel original and brutal

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
