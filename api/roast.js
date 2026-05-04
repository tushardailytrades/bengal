export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { loser, loserSeats, winnerSeats, winner } = req.body;

  const prompt = `West Bengal 2026 elections live count: ${winner} has ${winnerSeats} seats, ${loser} has ${loserSeats} seats. Write ONE brutally savage, funny, short roast (1-2 sentences max) mocking ${loser} for losing so badly. Write it in Hinglish (mix of Hindi and English, like how Indian people text — e.g. "yaar", "bhai", "kya kar raha hai", "toh kya hua", "teri toh", etc). Be ruthless, street-level savage, and hilarious. Use relevant emojis. Only output the roast, nothing else.`;

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
