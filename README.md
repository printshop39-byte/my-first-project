# प्रिंटशुभ — Maharashtra Land Records Platform

Marathi land platform with **AI-powered 7/12 OCR**, **cinematic satellite map**
(zoom-based district / taluka / village / survey labels), **measurement
comparison table**, **floating converter**, and a **knowledge / blog** section.

Built with **React 18 + Vite + Tailwind CSS + Leaflet + Anthropic Claude API**.

---

## 1. Quick Start (Local)

Requires **Node.js 18+** and **npm** (or pnpm/yarn).

```bash
# 1. Install dependencies
npm install

# 2. Configure your Anthropic API key
cp .env.example .env.local
# then open .env.local and paste your key from
# https://console.anthropic.com/settings/keys

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

> **Note:** The OCR endpoint at `/api/ocr` is a **Vercel serverless function**.
> When running `npm run dev`, that endpoint is _not_ live — only the static
> frontend is. To test OCR locally with one command, install the Vercel CLI:
>
> ```bash
> npm i -g vercel
> vercel dev
> ```
>
> This emulates `/api/ocr` locally on the same port. Without it, OCR will
> fail in dev — but **everything else works** (map, knowledge, measurement
> tools, demo mode in the Tool, etc.).

---

## 2. Project Structure

```
printshubh-platform/
├── api/
│   └── ocr.js                 ← Serverless proxy → Anthropic Messages API
├── public/
│   └── favicon.svg            ← Saffron-white-green flag favicon
├── src/
│   ├── App.jsx                ← Full app (~3600 lines, all components)
│   ├── main.jsx               ← React entry point
│   └── index.css              ← Tailwind directives + base resets
├── index.html                 ← Vite root + Leaflet CSS + Marathi meta
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                ← Function timeout config
├── .env.example               ← Copy to .env.local
├── .gitignore
└── README.md (this file)
```

`src/App.jsx` is intentionally a single large file — every component
(Header, Hero, Tool, PremiumMap, KnowledgeSection, MeasurementTable,
ConverterModal, etc.) lives in one place for easy search and editing.

---

## 3. Deploying to Vercel ⭐ (Recommended)

Vercel handles both the static frontend and the `/api/ocr` serverless
function out of the box. **5-minute deploy:**

1. Push this folder to a GitHub repo.
2. Go to <https://vercel.com/new> → **Import** that repo.
3. Vercel auto-detects Vite. Click **Deploy** as-is.
4. After first deploy: **Project → Settings → Environment Variables**.
   Add: `ANTHROPIC_API_KEY = sk-ant-...` (your real key).
5. Redeploy (Deployments → ⋯ → Redeploy).

Done. Your site is live at `https://your-project.vercel.app`.

OCR works automatically because Vercel routes `api/*.js` to its
serverless runtime.

### Custom domain (printshubh.shop)

Project → Settings → Domains → Add `printshubh.shop`.
Update your DNS at the registrar to point to Vercel's nameservers
(or add the A/CNAME records Vercel shows you).

---

## 4. Deploying to Hostinger

Two scenarios. Pick one:

### A. Static frontend on Hostinger + OCR proxy on Vercel (easiest)

1. **Frontend → Hostinger:**
   ```bash
   npm run build
   ```
   This creates `dist/`. Upload its **contents** (`index.html`, `assets/`,
   `favicon.svg`) to Hostinger via File Manager or FTP. Place at the
   `public_html` root for the domain.

2. **OCR proxy → Vercel (free):**
   - Push only the `api/` folder (plus a minimal `package.json` and
     `vercel.json`) to a separate Vercel project.
   - Set `ANTHROPIC_API_KEY` env var there.
   - You'll get a URL like `https://your-ocr.vercel.app/api/ocr`.

3. **Wire them together** — open `src/App.jsx`, find the `/api/ocr` call
   inside the `<Tool/>` component (search for `/api/ocr`), and change it
   to the absolute URL:
   ```js
   const res = await fetch("https://your-ocr.vercel.app/api/ocr", { ... })
   ```
   Rebuild and re-upload `dist/`.

### B. Hostinger Cloud / Node.js plan (single host)

If your Hostinger plan supports Node.js (Cloud Hosting / VPS):

1. Upload the entire project folder.
2. Run `npm install` in your hosting terminal.
3. Run `npm run build` to produce `dist/`.
4. Set up an Express wrapper that:
   - Serves `dist/` as static files
   - Routes `POST /api/ocr` to the handler in `api/ocr.js`
5. Set `ANTHROPIC_API_KEY` in your panel's environment variables.
6. Start the Node process.

Sample Express wrapper (save as `server.js`):

```js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ocrHandler from "./api/ocr.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/api/ocr", (req, res) => ocrHandler(req, res));
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(process.env.PORT || 3000);
```

Run with `node server.js`.

---

## 5. Features

- **AI 7/12 OCR** — Upload Marathi 7/12 image/PDF → Claude extracts
  village, taluka, district, survey number, area, owner. Auto-detects
  district to plot on map.
- **Cinematic satellite map** — Leaflet + Esri World Imagery. Multi-stage
  flyTo (zoom 6 → 10 → 14 → 17). 5 base layers (satellite/hybrid/terrain/
  dark/light). Animated pin with pulse rings.
- **Zoom-based Marathi labels** — 36 districts, 47 talukas, 32 villages,
  procedural survey numbers around the OCR pin. Smooth fade transitions.
- **Measurement table** — गुंठा / एकर / बिघा / R / हेक्टर comparison.
  Mobile-responsive card stack. Print-to-PDF in a separate window.
- **Floating converter** — Saffron FAB above WhatsApp. Modal with 7 units,
  swap button, quick reference panel.
- **Knowledge / blog** — 9 articles in Marathi (7/12 reading, फेरफार,
  measurement, PM किसान, RERA, वारस हक्क, etc.) with search + categories.
- **Government-styled report** — Saffron-white-green flag stripes, चक्र
  seal, certified-copy stamp, QR placeholder, signature lines. Print to
  A4 PDF via `window.print()`.

---

## 6. Customisation Pointers

All inside `src/App.jsx`:

- **Colors / fonts:** `const C = {...}` near the top + `:root { --navy: ... }`
  inside `<GlobalStyle/>`.
- **Phone / WhatsApp number:** search `8625801907` (5+ matches).
- **Articles:** `articles` array inside `<KnowledgeSection/>`.
- **Measurement rows:** `rows` array inside `<MeasurementTable/>`.
- **Map labels:** `TALUKA_LABELS` and `VILLAGE_LABELS` constants near the
  top. Add your real DataMeet GeoJSON village data here when you're ready
  to scale beyond the sample set.
- **OCR prompt:** Marathi extraction prompt is inside `<Tool/>` (search for
  `extract` near `runOCR`).

---

## 7. Troubleshooting

| Issue | Fix |
|---|---|
| `OCR fails with "API error 500"` | `ANTHROPIC_API_KEY` not set in env vars. Check your hosting dashboard. |
| `OCR fails with "API error 401"` | Key is wrong or expired. Generate a new one. |
| `Map tiles don't load` | Esri/CartoDB tiles need outbound HTTPS. Check your CSP / firewall. |
| `Marathi text shows boxes ▢▢▢` | Google Fonts blocked. Self-host `Tiro Devanagari Marathi` and `Hind Vadodara` if needed. |
| `Tailwind classes not applied` | Make sure `npm run dev` recompiled. Check `tailwind.config.js → content` paths. |

---

## 8. Tech Stack

- **React 18.3** + **Vite 6** — Fast HMR, ES build
- **Tailwind CSS 3.4** — Utility classes (also ~700 lines of custom CSS in `<GlobalStyle/>`)
- **Leaflet 1.9.4** — Loaded from CDN (`useLeaflet` hook)
- **Anthropic Claude API** — `claude-sonnet-4-5-20250929` for OCR (Marathi vision)
- **Esri World Imagery + CartoDB** — Map tiles (no API key required)
- **Google Fonts** — Tiro Devanagari Marathi, Hind Vadodara, Plus Jakarta Sans

---

## 9. License & Contact

Built for **printshubh.shop** by Sagar (Kolhapur, Maharashtra).

📞 **+91 86258 01907** · WhatsApp 24×7 · printshubh.shop

Made with ❤️ in Maharashtra.
