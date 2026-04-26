/**
 * api/ocr.js
 * ----------
 * Serverless proxy for the Anthropic Messages API.
 *
 * What it does:
 *   1. Holds ANTHROPIC_API_KEY server-side (never exposed to browser)
 *   2. Auto-detects PDF documents and adds the required beta header
 *   3. Forwards the real Anthropic error code/message to the frontend
 *      (so we don't lose the actual reason behind a generic 500)
 *   4. Logs upstream error details into Vercel Runtime Logs for debugging
 *
 * Required env var:  ANTHROPIC_API_KEY
 *   Set in Vercel → Project → Settings → Environment Variables.
 *   Get a key at: https://console.anthropic.com/settings/keys
 *
 * Frontend POSTs:
 *   { messages: [...] }   // standard Anthropic messages array
 */

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 2048;

export default async function handler(req, res) {
  // ----- CORS (allows frontend on a different origin if needed) -----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // ----- API key check -----
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "ANTHROPIC_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  try {
    // ----- Parse incoming body (Vercel auto-parses JSON, Netlify gives string) -----
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({
        error: "Request body must include a non-empty `messages` array.",
      });
    }

    // ----- Detect if any message contains a PDF document -----
    // PDFs require the anthropic-beta: pdfs-2024-09-25 header.
    const hasPdf = body.messages.some(
      (m) =>
        Array.isArray(m.content) &&
        m.content.some(
          (c) =>
            c?.type === "document" &&
            c?.source?.media_type === "application/pdf"
        )
    );

    // ----- Build headers -----
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (hasPdf) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    // ----- Forward to Anthropic -----
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

    // ----- Log upstream errors for easy debugging in Vercel Runtime Logs -----
    if (!upstream.ok) {
      console.error(
        "[/api/ocr] Anthropic returned",
        upstream.status,
        JSON.stringify(data, null, 2)
      );
    }

    // ----- Forward the real status code so the frontend sees the true error -----
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[/api/ocr] proxy exception:", err);
    return res.status(500).json({
      error: err?.message || "OCR proxy request failed.",
    });
  }
}
