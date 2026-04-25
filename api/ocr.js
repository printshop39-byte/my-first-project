/**
 * api/ocr.js
 * ----------
 * Serverless proxy for the Anthropic Messages API. Holds the
 * ANTHROPIC_API_KEY server-side so it never reaches the browser.
 *
 * Frontend POSTs JSON of shape:
 *   { messages: [...] }   // standard Anthropic messages array
 *
 * The proxy injects model + headers + max_tokens and forwards to
 * https://api.anthropic.com/v1/messages, then returns Anthropic's
 * response unchanged (so the existing parsing in <Tool/> keeps working).
 *
 * Compatible with Vercel Functions and Netlify Functions (default
 * Node.js handler signature). For self-hosting on Hostinger Cloud
 * Node.js, wrap this in an Express route.
 *
 * Required env var:  ANTHROPIC_API_KEY
 *   Vercel:    add in Project → Settings → Environment Variables
 *   Netlify:   Site settings → Environment variables
 *   Hostinger: .env or hosting control panel → Environment variables
 *
 * Get a key at: https://console.anthropic.com/settings/keys
 */

// You can override per-request by sending {"model": "..."} in the body.
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 1024;

export default async function handler(req, res) {
  // CORS — allow the frontend to call this even if hosted on a different
  // origin (e.g. static frontend on Hostinger + serverless on Vercel).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "ANTHROPIC_API_KEY is not configured. Add it as an environment variable in your hosting provider.",
    });
  }

  try {
    // Vercel parses JSON automatically; Netlify gives a string.
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({
        error: "Request body must include a non-empty `messages` array.",
      });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        max_tokens: body.max_tokens || DEFAULT_MAX_TOKENS,
        messages: body.messages,
      }),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[/api/ocr] error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "OCR proxy request failed." });
  }
}
