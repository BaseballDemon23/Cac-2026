// api/chat.js — a serverless function (works on Vercel out of the box).
// It receives { system, messages } from the app, adds your SECRET API key,
// and forwards the request to Anthropic. The key never reaches the browser.
//
// Set the key in your host's environment variables as:  ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY environment variable" });
  }

  try {
    const { system, messages } = req.body;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Haiku is fast and low-cost — good for short hints.
        // Swap to "claude-sonnet-4-6" if you want higher-quality explanations.
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Server error contacting Anthropic" });
  }
}
