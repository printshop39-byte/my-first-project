/**
 * api/ocr.js
 * ----------
 * Serverless proxy for the Anthropic Messages API. Holds the
 * ANTHROPIC_API_KEY server-side so it never reaches the browser.
 *
 * Adds the `anthropic-beta: pdfs-2024-09-25` header which is required
 * to send PDF documents in the messages content array.
 */

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 2048;

export default async function handler(req, res) {
  // CORS
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
        "ANTHROPIC_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({
        error: "Request body must include a non-empty `messages` array.",
      });
    }

    // Detect if any message contains a PDF document — if so, attach beta header.
    const hasPdf = body.messages.some((m) =>
      Array.isArray(m.content) &&
      m.content.some(
        (c) => c?.type === "document" && c?.source?.media_type === "application/pdf"
      )
    );

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (hasPdf) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        max_tokens: body.max_tokens || DEFAULT_MAX_TOKENS,
        messages: body.messages,
      }),
    });

    const data = await upstream.json();

    // Forward the upstream status code (Anthropic might return 400/401/429/etc.)
    // so the frontend gets the real error instead of a generic 500.
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[/api/ocr] error:", err);
    return res.status(500).json({
      error: err?.message || "OCR proxy request failed.",
      stack: err?.stack,
    });
  }
}
