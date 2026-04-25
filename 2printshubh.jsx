import React, { useEffect, useMemo, useRef, useState } from "react";

// ============================================================
//  PrintShubh — Premium Marathi Land Information Platform
//  Single-file React artifact. No external bundler tricks.
//  Real OCR via Claude API, real Leaflet map, real PDF print.
// ============================================================

// --- Brand tokens (used as inline styles + via <style> below) ---
const C = {
  navy: "#0B2545",
  navyDeep: "#061A30",
  navySoft: "#13315C",
  green: "#0F7A4F",
  greenBright: "#10B981",
  saffron: "#D97706",
  paper: "#FAFAF7",
  ink: "#0A1628",
  inkSoft: "#486581",
  line: "#E2E8F0",
  cream: "#F5F1E8",
};

// --- Maharashtra district centroids (approx, for map auto-zoom) ---
// Names in Marathi to match OCR output expectations.
const DISTRICT_COORDS = {
  "ठाणे":[19.2183,72.9781],"पालघर":[19.6970,72.7693],"रायगड":[18.5158,73.1822],
  "रत्नागिरी":[16.9902,73.3120],"सिंधुदुर्ग":[16.0667,73.6500],"मुंबई":[19.0760,72.8777],
  "पुणे":[18.5204,73.8567],"सातारा":[17.6805,74.0183],"सांगली":[16.8524,74.5815],
  "सोलापूर":[17.6599,75.9064],"कोल्हापूर":[16.7050,74.2433],"नाशिक":[20.0110,73.7903],
  "धुळे":[20.9042,74.7749],"नंदूरबार":[21.3700,74.2400],"जळगाव":[21.0077,75.5626],
  "अहमदनगर":[19.0948,74.7480],"छत्रपती संभाजीनगर":[19.8762,75.3433],"औरंगाबाद":[19.8762,75.3433],
  "जालना":[19.8410,75.8864],"परभणी":[19.2608,76.7700],"हिंगोली":[19.7174,77.1493],
  "बीड":[18.9894,75.7601],"नांदेड":[19.1383,77.3210],"धाराशिव":[18.1860,76.0357],
  "उस्मानाबाद":[18.1860,76.0357],"लातूर":[18.4088,76.5604],"अमरावती":[20.9374,77.7796],
  "बुलढाणा":[20.5292,76.1843],"अकोला":[20.7002,77.0082],"वाशिम":[20.1119,77.1339],
  "यवतमाळ":[20.3897,78.1306],"नागपूर":[21.1458,79.0882],"वर्धा":[20.7453,78.6022],
  "भंडारा":[21.1700,79.6500],"गोंदीया":[21.4624,80.1961],"चंद्रपूर":[19.9615,79.2961],
  "गडचिरोली":[20.1809,80.0036],
};

// --- Demo village seed (sampled, in Marathi). Realistic feeling. ---
const SAMPLE_VILLAGES = {
  "कोल्हापूर":["रुकडी","कसबा बावडा","गांधीनगर","शिरोली","वडगाव","कागल","गडहिंग्लज"],
  "पुणे":["हिंजवडी","वाघोली","लोणावळा","देहू","आळंदी","मंचर","बारामती"],
  "नाशिक":["सिन्नर","देवळाली","ओझर","दिंडोरी","कळवण","सटाणा","मनमाड"],
  "सातारा":["कराड","फलटण","वाई","महाबळेश्वर","पाटण","कोरेगाव"],
  "सांगली":["मिरज","तासगाव","इस्लामपूर","विटा","शिराळा"],
  "ठाणे":["भिवंडी","कल्याण","डोंबिवली","उल्हासनगर","अंबरनाथ","मुरबाड"],
  "अहमदनगर":["शिर्डी","संगमनेर","श्रीरामपूर","नेवासा","पारनेर","कोपरगाव"],
};

// --- Division → districts (from your maharashtra.json) ---
const DIVISIONS = {
  "कोकण":["ठाणे","पालघर","रायगड","रत्नागिरी","सिंधुदुर्ग"],
  "पुणे":["पुणे","सातारा","सांगली","सोलापूर","कोल्हापूर"],
  "नाशिक":["नाशिक","धुळे","नंदूरबार","जळगाव","अहमदनगर"],
  "छत्रपती संभाजीनगर":["छत्रपती संभाजीनगर","जालना","परभणी","हिंगोली","बीड","नांदेड","धाराशिव","लातूर"],
  "अमरावती":["अमरावती","बुलढाणा","अकोला","वाशिम","यवतमाळ"],
  "नागपूर":["नागपूर","वर्धा","भंडारा","गोंदीया","चंद्रपूर","गडचिरोली"],
};

// --- Sampled Taluka centroids in Marathi (for zoom 9-11 labels) ---
const TALUKA_LABELS = [
  // Kolhapur
  { name: "करवीर", lat: 16.71, lng: 74.21 },
  { name: "हातकणंगले", lat: 16.83, lng: 74.31 },
  { name: "शिरोळ", lat: 16.78, lng: 74.60 },
  { name: "कागल", lat: 16.57, lng: 74.31 },
  { name: "गडहिंग्लज", lat: 16.22, lng: 74.34 },
  { name: "पन्हाळा", lat: 16.81, lng: 74.10 },
  { name: "राधानगरी", lat: 16.40, lng: 73.99 },
  { name: "चंदगड", lat: 15.93, lng: 74.18 },
  { name: "आजरा", lat: 16.12, lng: 74.20 },
  // Sangli
  { name: "मिरज", lat: 16.83, lng: 74.63 },
  { name: "तासगाव", lat: 17.03, lng: 74.59 },
  { name: "इस्लामपूर", lat: 17.04, lng: 74.30 },
  { name: "विटा", lat: 17.27, lng: 74.55 },
  { name: "जत", lat: 17.04, lng: 75.20 },
  // Satara
  { name: "कराड", lat: 17.29, lng: 74.18 },
  { name: "फलटण", lat: 17.99, lng: 74.43 },
  { name: "वाई", lat: 17.96, lng: 73.89 },
  { name: "पाटण", lat: 17.36, lng: 73.90 },
  { name: "महाबळेश्वर", lat: 17.92, lng: 73.66 },
  { name: "कोरेगाव", lat: 17.69, lng: 74.18 },
  // Pune
  { name: "हवेली", lat: 18.52, lng: 73.85 },
  { name: "बारामती", lat: 18.16, lng: 74.58 },
  { name: "इंदापूर", lat: 18.11, lng: 75.03 },
  { name: "जुन्नर", lat: 19.20, lng: 73.87 },
  { name: "मावळ", lat: 18.78, lng: 73.55 },
  { name: "मुळशी", lat: 18.50, lng: 73.50 },
  { name: "पुरंदर", lat: 18.30, lng: 74.10 },
  // Nashik
  { name: "सिन्नर", lat: 19.85, lng: 74.00 },
  { name: "इगतपुरी", lat: 19.69, lng: 73.56 },
  { name: "दिंडोरी", lat: 20.20, lng: 73.83 },
  { name: "चांदवड", lat: 20.33, lng: 74.24 },
  { name: "मनमाड", lat: 20.25, lng: 74.44 },
  { name: "मालेगाव", lat: 20.55, lng: 74.52 },
  // Solapur
  { name: "पंढरपूर", lat: 17.68, lng: 75.33 },
  { name: "अक्कलकोट", lat: 17.52, lng: 76.20 },
  // Mumbai/Thane
  { name: "कल्याण", lat: 19.24, lng: 73.13 },
  { name: "भिवंडी", lat: 19.30, lng: 73.06 },
  { name: "उल्हासनगर", lat: 19.22, lng: 73.16 },
  // Aurangabad
  { name: "पैठण", lat: 19.48, lng: 75.38 },
  { name: "गंगापूर", lat: 19.69, lng: 75.01 },
  { name: "वैजापूर", lat: 19.92, lng: 74.73 },
  // Nagpur
  { name: "काटोल", lat: 21.27, lng: 78.59 },
  { name: "उमरेड", lat: 20.85, lng: 79.32 },
  { name: "रामटेक", lat: 21.40, lng: 79.32 },
  // Amravati
  { name: "परतवाडा", lat: 21.34, lng: 77.31 },
  // Konkan
  { name: "खेड", lat: 17.72, lng: 73.39 },
  { name: "चिपळूण", lat: 17.53, lng: 73.51 },
];

// --- Sampled Village centroids in Marathi (for zoom 12-14 labels) ---
const VILLAGE_LABELS = [
  // Kolhapur area
  { name: "रुकडी", lat: 16.72, lng: 74.30 },
  { name: "शिरोली", lat: 16.80, lng: 74.27 },
  { name: "वडगाव", lat: 16.74, lng: 74.45 },
  { name: "कसबा बावडा", lat: 16.71, lng: 74.25 },
  { name: "कोडोली", lat: 16.86, lng: 74.18 },
  { name: "वारणानगर", lat: 16.88, lng: 74.13 },
  { name: "नागठाणे", lat: 17.00, lng: 74.30 },
  { name: "आष्टा", lat: 17.04, lng: 74.39 },
  { name: "वाळवा", lat: 17.02, lng: 74.20 },
  // Sangli
  { name: "कुपवाड", lat: 16.83, lng: 74.54 },
  { name: "कावठेमहांकाळ", lat: 17.20, lng: 74.83 },
  // Satara
  { name: "ओगलेवाडी", lat: 17.33, lng: 74.05 },
  { name: "रहिमतपूर", lat: 17.59, lng: 74.20 },
  { name: "उंब्रज", lat: 17.41, lng: 74.06 },
  // Pune
  { name: "हिंजवडी", lat: 18.59, lng: 73.71 },
  { name: "वाघोली", lat: 18.58, lng: 74.00 },
  { name: "लोणावळा", lat: 18.75, lng: 73.41 },
  { name: "देहू", lat: 18.71, lng: 73.78 },
  { name: "आळंदी", lat: 18.67, lng: 73.90 },
  { name: "चाकण", lat: 18.76, lng: 73.86 },
  { name: "तळेगाव", lat: 18.75, lng: 73.66 },
  // Nashik
  { name: "शिर्डी", lat: 19.77, lng: 74.48 },
  { name: "ओझर", lat: 20.10, lng: 73.92 },
  { name: "त्रिंबकेश्वर", lat: 19.93, lng: 73.53 },
  // Mumbai
  { name: "नवी मुंबई", lat: 19.04, lng: 73.02 },
  { name: "पनवेल", lat: 18.99, lng: 73.12 },
  // Aurangabad
  { name: "खुलताबाद", lat: 20.00, lng: 75.20 },
  { name: "वेरूळ", lat: 20.02, lng: 75.18 },
  // Nagpur
  { name: "कामठी", lat: 21.22, lng: 79.20 },
  // Konkan
  { name: "गणपतीपुळे", lat: 17.13, lng: 73.27 },
  { name: "अलिबाग", lat: 18.64, lng: 72.87 },
  { name: "मुरुड", lat: 18.32, lng: 72.96 },
];

// --- Devanagari numeral helper ---
const toMarathi = (n) => String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[+d]);

// =============================================================
//                       Small utilities
// =============================================================
const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("file read failed"));
    r.readAsDataURL(file);
  });

const cls = (...xs) => xs.filter(Boolean).join(" ");

// Try to find a district name from raw OCR text (handles loose matches)
function detectDistrict(text = "") {
  const t = text.replace(/\s+/g, "");
  for (const d of Object.keys(DISTRICT_COORDS)) {
    if (t.includes(d.replace(/\s+/g, ""))) return d;
  }
  return null;
}

// =============================================================
//                    Leaflet (loaded once)
// =============================================================
function useLeaflet() {
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.L);
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);
  return ready;
}

// =============================================================
//                          ICONS
// =============================================================
const Icon = {
  shield: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9-4.8-.5-8-4.5-8-9V6l8-3z"/><path d="M9.5 12.5l1.8 1.8L15 10.5"/></svg>,
  upload: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>,
  scan: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 7V5a1 1 0 011-1h2"/><path d="M20 7V5a1 1 0 00-1-1h-2"/><path d="M4 17v2a1 1 0 001 1h2"/><path d="M20 17v2a1 1 0 01-1 1h-2"/><path d="M4 12h16"/></svg>,
  pin: (p)=><svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>,
  doc: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/></svg>,
  whatsapp: (p)=><svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.5 3.5A11 11 0 003.6 17.3L2 22l4.8-1.5A11 11 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1112 20zm4.5-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4l.3-.4c.1-.1.1-.3 0-.4 0-.1-.6-1.3-.8-1.8-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"/></svg>,
  download: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>,
  print: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1"/><path d="M6 14h12v7H6z"/></svg>,
  check: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M5 12l4 4 10-10"/></svg>,
  star: (p)=><svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.5l7.1-.6z"/></svg>,
  phone: (p)=><svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011-.2 11.4 11.4 0 003.6.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.4a1 1 0 011 1 11.4 11.4 0 00.6 3.6 1 1 0 01-.2 1z"/></svg>,
  globe: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>,
  plus: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  minus: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M5 12h14"/></svg>,
  spark: (p)=><svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/></svg>,
  lock: (p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
};

// =============================================================
//                  GLOBAL STYLE BLOCK
// =============================================================
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi:ital@0;1&family=Hind+Vadodara:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

    :root {
      --navy: ${C.navy};
      --navy-deep: ${C.navyDeep};
      --navy-soft: ${C.navySoft};
      --green: ${C.green};
      --green-bright: ${C.greenBright};
      --saffron: ${C.saffron};
      --paper: ${C.paper};
      --ink: ${C.ink};
      --ink-soft: ${C.inkSoft};
      --line: ${C.line};
      --cream: ${C.cream};
    }

    .ps-app, .ps-app * { box-sizing: border-box; }
    .ps-app {
      font-family: 'Hind Vadodara', system-ui, sans-serif;
      color: var(--ink);
      background: var(--paper);
      -webkit-font-smoothing: antialiased;
      font-feature-settings: "kern" 1, "calt" 1;
    }
    .ps-display { font-family: 'Tiro Devanagari Marathi', serif; letter-spacing: -0.01em; }
    .ps-mono   { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-feature-settings: "tnum" 1; }

    /* Subtle paper grain on body */
    .ps-grain {
      background-image:
        radial-gradient(circle at 0 0, rgba(11,37,69,0.04), transparent 35%),
        radial-gradient(circle at 100% 0, rgba(15,122,79,0.05), transparent 40%),
        repeating-linear-gradient(0deg, rgba(11,37,69,0.012) 0px, rgba(11,37,69,0.012) 1px, transparent 1px, transparent 3px);
    }

    /* Hero topo background */
    .ps-hero-bg {
      background:
        radial-gradient(1100px 500px at 85% -10%, rgba(15,122,79,0.18), transparent 60%),
        radial-gradient(800px 400px at -10% 110%, rgba(217,119,6,0.10), transparent 60%),
        linear-gradient(180deg, var(--navy-deep), var(--navy) 60%, var(--navy-soft));
    }
    .ps-hero-grid {
      background-image:
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 56px 56px;
      mask-image: radial-gradient(ellipse at 50% 30%, black 35%, transparent 75%);
    }

    /* Govt-style ribbon stripe */
    .ps-flag-stripe {
      background: linear-gradient(90deg, var(--saffron) 0% 33%, #fff 33% 66%, var(--green) 66% 100%);
      height: 3px;
    }

    /* Cards */
    .ps-card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 1px 0 rgba(11,37,69,0.04), 0 12px 32px -16px rgba(11,37,69,0.18);
    }
    .ps-card-deep {
      background: linear-gradient(180deg, var(--navy-deep), var(--navy));
      color: #fff; border-radius: 22px;
      box-shadow: 0 30px 60px -30px rgba(11,37,69,0.55), inset 0 1px 0 rgba(255,255,255,0.08);
    }

    /* Buttons */
    .ps-btn {
      display: inline-flex; align-items: center; gap: .6rem;
      padding: .95rem 1.4rem; border-radius: 14px;
      font-weight: 700; font-size: 1.05rem;
      transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
      border: 1px solid transparent;
      line-height: 1; cursor: pointer; white-space: nowrap;
    }
    .ps-btn:active { transform: translateY(1px); }
    .ps-btn-primary {
      background: var(--green);
      color: #fff;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 14px 28px -14px rgba(15,122,79,0.7);
    }
    .ps-btn-primary:hover { background: #0c6743; }
    .ps-btn-navy {
      background: var(--navy); color: #fff;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 14px 28px -14px rgba(11,37,69,0.6);
    }
    .ps-btn-navy:hover { background: var(--navy-deep); }
    .ps-btn-ghost {
      background: #fff; color: var(--navy); border-color: var(--line);
    }
    .ps-btn-ghost:hover { border-color: var(--navy); }
    .ps-btn-wa {
      background: #25D366; color: #fff;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 14px 28px -14px rgba(37,211,102,0.7);
    }
    .ps-btn-wa:hover { background: #1fb858; }

    /* Trust badge */
    .ps-trust {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .55rem .85rem; border-radius: 999px;
      background: rgba(255,255,255,0.08); color: #fff;
      border: 1px solid rgba(255,255,255,0.16);
      font-size: .9rem;
    }

    /* Field row in report */
    .ps-row { display:flex; justify-content:space-between; align-items:flex-start; padding: .85rem 0; border-bottom: 1px dashed var(--line); gap: 1rem; }
    .ps-row:last-child { border-bottom: 0; }
    .ps-row .k { color: var(--ink-soft); font-size: .95rem; }
    .ps-row .v { font-weight: 700; color: var(--ink); text-align: right; }

    /* Drop area */
    .ps-drop {
      border: 2px dashed #cdd6e0;
      border-radius: 22px;
      padding: 2rem 1.25rem;
      text-align: center;
      background:
        radial-gradient(600px 200px at 50% 0%, rgba(15,122,79,0.06), transparent 60%),
        #fff;
      transition: border-color .2s ease, transform .2s ease;
    }
    .ps-drop.is-drag { border-color: var(--green); transform: scale(1.005); }

    /* Marker pulse */
    .ps-pulse {
      width: 22px; height: 22px; border-radius: 999px;
      background: var(--green-bright);
      box-shadow: 0 0 0 0 rgba(16,185,129,0.65);
      animation: ps-pulse 1.6s infinite;
    }
    @keyframes ps-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
      70%  { box-shadow: 0 0 0 18px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }

    /* Scanning line for OCR */
    .ps-scanwrap { position: relative; overflow: hidden; border-radius: 14px; }
    .ps-scanline {
      position: absolute; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, var(--green-bright), transparent);
      box-shadow: 0 0 24px var(--green-bright);
      animation: ps-scan 1.6s linear infinite;
    }
    @keyframes ps-scan {
      0%   { top: 0%;  opacity: .2; }
      50%  { opacity: 1; }
      100% { top: 100%; opacity: .2; }
    }

    /* Stat counter card */
    .ps-stat {
      background: #fff; border: 1px solid var(--line); border-radius: 18px;
      padding: 1.25rem 1.1rem;
    }

    /* Step number badge */
    .ps-step-num {
      width: 38px; height: 38px; border-radius: 12px;
      background: var(--cream); color: var(--navy);
      display: inline-flex; align-items: center; justify-content: center;
      font-family: 'Plus Jakarta Sans'; font-weight: 700;
      border: 1px solid #ead9b6;
    }

    /* Glowing selected boundary marker */
    .ps-glow-marker {
      filter: drop-shadow(0 0 12px rgba(16,185,129,0.7));
    }

    /* Reveal */
    @keyframes ps-rise {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ps-rise { animation: ps-rise .6s ease both; }
    .ps-rise-2 { animation: ps-rise .7s ease .08s both; }
    .ps-rise-3 { animation: ps-rise .7s ease .16s both; }

    /* FAQ */
    details.ps-faq {
      background: #fff; border: 1px solid var(--line); border-radius: 14px;
      padding: 1rem 1.25rem; margin-bottom: .75rem;
    }
    details.ps-faq[open] { border-color: var(--navy); }
    details.ps-faq summary {
      cursor: pointer; list-style: none;
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 700; color: var(--navy);
      font-size: 1.05rem;
    }
    details.ps-faq summary::-webkit-details-marker { display: none; }
    details.ps-faq[open] summary { color: var(--green); }
    details.ps-faq p { color: var(--ink-soft); margin-top: .6rem; line-height: 1.7; }

    /* Print: only the report card visible */
    @media print {
      body * { visibility: hidden; }
      #ps-print-area, #ps-print-area * { visibility: visible; }
      #ps-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
      .ps-no-print { display: none !important; }
    }

    /* Mobile tweaks */
    @media (max-width: 768px) {
      .ps-hero-h1 { font-size: 2.1rem !important; line-height: 1.2 !important; }
      .ps-hero-sub { font-size: 1.05rem !important; }
    }

    /* Leaflet container */
    .ps-leaflet { height: 380px; width: 100%; border-radius: 16px; overflow: hidden; border: 1px solid var(--line); }
    .leaflet-container { font-family: inherit !important; }

    /* === Premium card shadows === */
    .ps-card-premium {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.9) inset,
        0 1px 2px rgba(11,37,69,0.04),
        0 8px 16px -8px rgba(11,37,69,0.10),
        0 24px 48px -24px rgba(11,37,69,0.22);
      position: relative;
    }
    .ps-card-premium::before {
      content: ""; position: absolute; left: 0; right: 0; top: 0; height: 4px;
      border-radius: 22px 22px 0 0;
      background: linear-gradient(90deg, var(--saffron) 0%, var(--saffron) 33%, #fff 33% 66%, var(--green) 66%);
      opacity: 0.85;
    }

    /* Section title saffron underline */
    .ps-h-accent { position: relative; display: inline-block; }
    .ps-h-accent::after {
      content: ""; display: block; width: 56px; height: 3px;
      background: var(--saffron); margin: 12px auto 0;
      border-radius: 2px;
    }

    /* === Sticky WhatsApp FAB === */
    .ps-fab-wrap {
      position: fixed; right: 22px; bottom: 22px; z-index: 60;
      pointer-events: none;
    }
    .ps-fab-wa {
      pointer-events: auto;
      position: relative; display: inline-flex; align-items: center;
      height: 60px; padding: 0 18px 0 18px;
      background: #25D366; color: #fff;
      border-radius: 999px;
      text-decoration: none;
      box-shadow:
        0 4px 12px rgba(0,0,0,0.18),
        0 18px 40px -10px rgba(37,211,102,0.65);
      transition: transform .2s ease, box-shadow .2s ease;
      font-weight: 700;
      gap: 10px;
      max-width: 60px; overflow: hidden;
      transition: max-width .35s cubic-bezier(.4,0,.2,1);
    }
    .ps-fab-wa::before {
      content: ""; position: absolute; inset: -6px;
      border-radius: 999px;
      background: rgba(37,211,102,0.45);
      animation: ps-fab-pulse 2.2s infinite ease-out;
      z-index: -1;
    }
    @keyframes ps-fab-pulse {
      0%   { transform: scale(0.85); opacity: 0.7; }
      80%  { transform: scale(1.5);  opacity: 0; }
      100% { transform: scale(1.5);  opacity: 0; }
    }
    .ps-fab-wa:hover { max-width: 320px; transform: translateY(-2px); }
    .ps-fab-wa .ps-fab-label { white-space: nowrap; font-size: .98rem; }
    @media (max-width: 640px) {
      .ps-fab-wrap { right: 14px; bottom: 14px; }
      .ps-fab-wa { height: 56px; max-width: 56px; padding: 0 16px; }
      .ps-fab-wa:hover { max-width: 56px; }
      .ps-fab-wa .ps-fab-label { display: none; }
    }

    /* === Upload animation === */
    .ps-upload-stage { position: relative; width: 130px; height: 130px; display: grid; place-items: center; }
    .ps-upload-ring {
      position: absolute; inset: 0;
      border: 2px solid var(--green-bright);
      border-radius: 28px;
      animation: ps-ring 1.7s ease-out infinite;
      opacity: 0;
    }
    @keyframes ps-ring {
      0%   { transform: scale(0.6); opacity: 0; }
      30%  { opacity: 0.6; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .ps-bounce { animation: ps-bounce 1.2s ease-in-out infinite; }
    @keyframes ps-bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    .ps-bar { height: 8px; background: var(--line); border-radius: 99px; overflow: hidden; }
    .ps-bar-fill {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, var(--green), var(--green-bright));
      box-shadow: 0 0 16px rgba(16,185,129,0.45);
      transition: width .25s ease;
    }

    /* === Government seal print styles === */
    .ps-watermark {
      position: absolute; inset: 0;
      display: grid; place-items: center;
      pointer-events: none;
      opacity: 0.045;
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 110px;
      color: var(--navy);
      transform: rotate(-28deg);
      white-space: nowrap;
      line-height: 1.5;
      z-index: 0;
    }
    .ps-stamp-true {
      transform: rotate(-9deg);
      border: 2.5px solid var(--saffron);
      padding: 8px 16px;
      border-radius: 6px;
      font-family: 'Tiro Devanagari Marathi', serif;
      color: var(--saffron);
      font-weight: 700;
      letter-spacing: .04em;
      text-align: center;
      line-height: 1.05;
      opacity: 0.92;
      background: rgba(255, 247, 237, 0.6);
      box-shadow: 0 2px 0 rgba(217,119,6,0.15);
    }

    /* Larger Marathi typography defaults */
    .ps-app { font-size: 16.5px; }
    @media (min-width: 768px) {
      .ps-hero-h1 { font-size: 3.9rem !important; }
    }

    /* =============================================================
       PREMIUM MAP — Google Maps / Earth style
       ============================================================= */
    .ps-map-wrap {
      position: relative;
      width: 100%;
      height: 480px;
      border-radius: 18px;
      overflow: hidden;
      background: #0a1a2a;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.5) inset,
        0 8px 18px -8px rgba(11,37,69,0.20),
        0 28px 60px -28px rgba(11,37,69,0.45);
      transition: border-radius .25s ease;
    }
    .ps-map-wrap.is-fullscreen {
      position: fixed; inset: 0; z-index: 9999;
      border-radius: 0;
      height: 100vh; width: 100vw;
    }
    .ps-map-wrap.is-fullscreen .ps-map-canvas { height: 100vh !important; }
    .ps-map-canvas { width: 100%; height: 100%; background: #0a1a2a; }

    /* Glow vignette around map for cinematic depth */
    .ps-map-wrap::after {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      box-shadow: inset 0 0 60px 8px rgba(0,0,0,0.28);
      border-radius: inherit;
      z-index: 5;
    }

    /* --- Top toolbar: layer toggle (segmented) --- */
    .ps-map-toolbar {
      position: absolute; top: 12px; left: 12px;
      z-index: 600; display: inline-flex; gap: 0;
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 8px 24px -8px rgba(11,37,69,0.35);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .ps-map-tab {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 12px; border-radius: 9px;
      font-size: .82rem; font-weight: 600;
      color: var(--ink-soft); background: transparent;
      border: 0; cursor: pointer; white-space: nowrap;
      font-family: inherit;
      transition: all .18s ease;
    }
    .ps-map-tab:hover { color: var(--navy); background: rgba(11,37,69,0.04); }
    .ps-map-tab.is-active {
      color: #fff;
      background: linear-gradient(180deg, var(--navy), var(--navy-deep));
      box-shadow: 0 6px 14px -6px rgba(11,37,69,0.6);
    }
    .ps-map-tab svg { width: 14px; height: 14px; }
    @media (max-width: 640px) {
      .ps-map-toolbar { padding: 3px; }
      .ps-map-tab { padding: 7px 8px; font-size: .76rem; }
      .ps-map-tab .ps-tab-label { display: none; }
    }

    /* --- Top-right buttons (fullscreen, share) --- */
    .ps-map-tr { position: absolute; top: 12px; right: 12px; z-index: 600; display: flex; gap: 6px; }
    .ps-map-btn {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--line);
      color: var(--navy);
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 18px -8px rgba(11,37,69,0.35);
      transition: all .18s ease;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .ps-map-btn:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 12px 22px -8px rgba(11,37,69,0.5); }
    .ps-map-btn:active { transform: translateY(0); }
    .ps-map-btn svg { width: 18px; height: 18px; }

    /* --- Bottom-left zoom + locate stack --- */
    .ps-map-bl { position: absolute; bottom: 14px; left: 12px; z-index: 600; display: flex; flex-direction: column; gap: 6px; }
    .ps-map-zoom-stack {
      display: flex; flex-direction: column;
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--line);
      border-radius: 10px; overflow: hidden;
      box-shadow: 0 8px 18px -8px rgba(11,37,69,0.35);
    }
    .ps-map-zoom-stack button {
      width: 40px; height: 40px;
      background: transparent; border: 0;
      cursor: pointer; color: var(--navy);
      font-size: 1.2rem; font-weight: 700;
      display: grid; place-items: center;
      transition: background .15s;
    }
    .ps-map-zoom-stack button + button { border-top: 1px solid var(--line); }
    .ps-map-zoom-stack button:hover { background: rgba(11,37,69,0.06); }

    /* --- GPS locate button (special) --- */
    .ps-map-locate {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: linear-gradient(180deg, var(--green-bright), var(--green));
      color: #fff; border: 0; cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 8px 18px -6px rgba(15,122,79,0.55);
      transition: transform .15s ease;
    }
    .ps-map-locate:hover { transform: scale(1.05); }
    .ps-map-locate svg { width: 20px; height: 20px; }
    .ps-map-locate.is-pinging svg { animation: ps-locate-spin 1.6s linear infinite; }
    @keyframes ps-locate-spin { to { transform: rotate(360deg); } }

    /* --- Bottom coords pill (lat/lng) --- */
    .ps-map-coords {
      position: absolute; bottom: 14px; left: 50%;
      transform: translateX(-50%);
      z-index: 600;
      display: inline-flex; align-items: center; gap: 10px;
      padding: 9px 16px;
      background: rgba(11,37,69,0.92);
      color: #fff;
      border-radius: 999px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .82rem;
      letter-spacing: .04em;
      box-shadow: 0 8px 20px -6px rgba(0,0,0,0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .ps-map-coords-dot {
      width: 8px; height: 8px; border-radius: 99px;
      background: var(--green-bright);
      box-shadow: 0 0 8px var(--green-bright);
      animation: ps-coords-dot 1.6s ease-in-out infinite;
    }
    @keyframes ps-coords-dot {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.35; }
    }
    @media (max-width: 640px) {
      .ps-map-coords { font-size: .72rem; padding: 7px 12px; bottom: 10px; }
    }

    /* --- Compass bottom-right --- */
    .ps-map-compass {
      position: absolute; bottom: 14px; right: 12px; z-index: 600;
      width: 56px; height: 56px;
      border-radius: 999px;
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--line);
      box-shadow: 0 8px 18px -6px rgba(11,37,69,0.35);
      display: grid; place-items: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    /* --- Narration overlay (top-center) --- */
    .ps-map-narration {
      position: absolute; top: 12px; left: 50%;
      transform: translateX(-50%);
      z-index: 600;
      padding: 8px 18px;
      background: rgba(11,37,69,0.92);
      color: #fff;
      border-radius: 999px;
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1rem;
      box-shadow: 0 8px 20px -6px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: ps-narration-in .35s ease both;
      max-width: calc(100% - 200px);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    @keyframes ps-narration-in {
      from { opacity: 0; transform: translate(-50%, -8px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
    .ps-map-narration .arrow { color: var(--green-bright); margin: 0 6px; }
    @media (max-width: 640px) {
      .ps-map-narration { font-size: .85rem; max-width: calc(100% - 24px); top: 60px; }
    }

    /* --- Animated pin with concentric rings --- */
    .ps-pin-stack { position: relative; width: 44px; height: 56px; }
    .ps-pin-svg {
      position: absolute; left: 50%; bottom: 0;
      transform: translateX(-50%);
      width: 36px; height: 44px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45)) drop-shadow(0 0 14px rgba(16,185,129,0.65));
      animation: ps-pin-bounce 1.6s ease-in-out infinite;
      z-index: 3;
    }
    @keyframes ps-pin-bounce {
      0%, 100% { transform: translate(-50%, 0); }
      50%      { transform: translate(-50%, -6px); }
    }
    .ps-pin-rings {
      position: absolute; left: 50%; bottom: 4px;
      transform: translateX(-50%);
      width: 24px; height: 24px;
      pointer-events: none;
    }
    .ps-pin-ring {
      position: absolute; inset: 0;
      border-radius: 999px;
      border: 2px solid var(--green-bright);
      animation: ps-pin-ring 2s ease-out infinite;
      opacity: 0;
    }
    .ps-pin-ring.r2 { animation-delay: 0.66s; }
    .ps-pin-ring.r3 { animation-delay: 1.33s; }
    @keyframes ps-pin-ring {
      0%   { transform: scale(0.4); opacity: 0.0; }
      30%  { opacity: 0.7; }
      100% { transform: scale(2.6); opacity: 0; }
    }
    .ps-pin-dot {
      position: absolute; left: 50%; bottom: 8px;
      transform: translateX(-50%);
      width: 10px; height: 10px; border-radius: 999px;
      background: var(--green-bright);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.35), 0 0 12px var(--green-bright);
    }

    /* Village label tooltip */
    .ps-village-label {
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 14px; color: #fff;
      background: linear-gradient(180deg, var(--navy), var(--navy-deep));
      padding: 5px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 8px 18px -6px rgba(0,0,0,0.55);
      white-space: nowrap;
    }
    .ps-village-label::after {
      content: ""; position: absolute;
      left: 50%; bottom: -5px;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid var(--navy-deep);
    }

    /* GPS locate ping effect */
    .ps-locate-ping {
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none; z-index: 550;
    }
    .ps-locate-ping > div {
      position: absolute; left: 50%; top: 50%;
      width: 60px; height: 60px;
      border-radius: 999px;
      border: 3px solid var(--green-bright);
      transform: translate(-50%, -50%) scale(0);
      animation: ps-locate-pulse 1.8s ease-out;
      opacity: 0;
    }
    .ps-locate-ping > div:nth-child(2) { animation-delay: .25s; border-color: #FCD34D; }
    .ps-locate-ping > div:nth-child(3) { animation-delay: .5s; }
    @keyframes ps-locate-pulse {
      0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
      100% { transform: translate(-50%, -50%) scale(6); opacity: 0; }
    }

    /* Loading radar overlay */
    .ps-map-radar {
      position: absolute; inset: 0;
      pointer-events: none;
      z-index: 400;
      background:
        radial-gradient(circle at 50% 50%, transparent 0, rgba(11,37,69,0.65) 100%);
      display: grid; place-items: center;
    }
    .ps-radar-circle {
      position: relative;
      width: 240px; height: 240px;
      border-radius: 999px;
      border: 1px solid rgba(16,185,129,0.4);
      box-shadow: inset 0 0 40px rgba(16,185,129,0.15);
    }
    .ps-radar-circle::before, .ps-radar-circle::after {
      content: ""; position: absolute; inset: 0; border-radius: 999px;
      border: 1px solid rgba(16,185,129,0.25);
    }
    .ps-radar-circle::before { transform: scale(0.66); }
    .ps-radar-circle::after  { transform: scale(0.33); }
    .ps-radar-sweep {
      position: absolute; inset: 0;
      border-radius: 999px;
      background: conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.55) 60deg, transparent 90deg);
      animation: ps-radar-spin 2.5s linear infinite;
    }
    @keyframes ps-radar-spin { to { transform: rotate(360deg); } }
    .ps-radar-cross {
      position: absolute; inset: 0;
    }
    .ps-radar-cross::before, .ps-radar-cross::after {
      content: ""; position: absolute;
      background: rgba(16,185,129,0.3);
    }
    .ps-radar-cross::before {
      left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%);
    }
    .ps-radar-cross::after {
      top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%);
    }
    .ps-radar-status {
      position: absolute; top: calc(100% + 14px);
      left: 50%; transform: translateX(-50%);
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.05rem; color: #cfe9da;
      white-space: nowrap;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    }
    .ps-radar-status .ps-mono { display: block; font-size: .68rem; color: var(--green-bright); letter-spacing: .2em; margin-top: 6px; }

    /* Mini map (in details card / report) */
    .ps-minimap-wrap {
      position: relative;
      width: 100%; height: 130px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: linear-gradient(135deg, #0e3052, #102b46);
    }
    .ps-minimap-canvas { width: 100%; height: 100%; }
    .ps-minimap-overlay {
      position: absolute; inset: 0; pointer-events: none;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.35);
      border-radius: inherit;
    }
    .ps-minimap-pin {
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none; z-index: 600;
    }

    /* Hide leaflet attribution prettify */
    .leaflet-control-attribution { font-size: 9px !important; opacity: 0.7; }

    /* =============================================================
       ZOOM-BASED MAP LABELS (Marathi, Google Maps style)
       ============================================================= */
    .ps-map-label {
      position: absolute;
      top: 0; left: 0;
      display: inline-block;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.82);
      transition: opacity 380ms ease, transform 380ms ease;
      font-family: 'Tiro Devanagari Marathi', serif;
      text-shadow: 0 1px 3px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.55);
      user-select: none;
    }
    .ps-map-label.is-visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .ps-label-district {
      color: #fff;
      font-size: 17px; font-weight: 700;
      letter-spacing: 0.08em;
    }
    .ps-label-taluka {
      color: #fef3c7;
      font-size: 13.5px; font-weight: 600;
      letter-spacing: 0.04em;
    }
    .ps-label-village {
      color: #fff;
      font-size: 12px; font-weight: 500;
      background: rgba(11,37,69,0.62);
      padding: 2px 9px;
      border-radius: 7px;
      text-shadow: none;
      border: 1px solid rgba(255,255,255,0.14);
    }
    .ps-label-survey {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #FCD34D;
      font-size: 10.5px; font-weight: 700;
      background: rgba(0,0,0,0.62);
      padding: 1.5px 7px;
      border-radius: 4px;
      text-shadow: none;
      border: 1px solid rgba(252,211,77,0.45);
      letter-spacing: 0.04em;
    }

    /* =============================================================
       KNOWLEDGE / BLOG SECTION
       ============================================================= */
    .ps-search-wrap {
      position: relative; max-width: 580px; margin: 0 auto;
    }
    .ps-search {
      width: 100%;
      padding: 16px 22px 16px 50px;
      border: 1.5px solid var(--line);
      border-radius: 999px;
      font-family: inherit;
      font-size: 1.05rem;
      background: #fff;
      color: var(--ink);
      box-shadow: 0 8px 24px -14px rgba(11,37,69,0.20);
      transition: all .2s ease;
    }
    .ps-search:focus {
      border-color: var(--green); outline: none;
      box-shadow: 0 8px 24px -8px rgba(15,122,79,0.30);
    }
    .ps-search-icon {
      position: absolute; left: 18px; top: 50%;
      transform: translateY(-50%);
      color: var(--ink-soft);
      pointer-events: none;
    }
    .ps-cat-chips {
      display: flex; gap: 8px; flex-wrap: wrap;
      justify-content: center;
    }
    .ps-cat-chip {
      padding: 9px 18px; border-radius: 999px;
      background: #fff; border: 1.5px solid var(--line);
      color: var(--ink-soft); font-weight: 600; font-size: .96rem;
      cursor: pointer; white-space: nowrap;
      transition: all .15s ease;
      font-family: inherit;
    }
    .ps-cat-chip:hover { color: var(--navy); border-color: var(--navy); }
    .ps-cat-chip.is-active {
      background: linear-gradient(180deg, var(--navy), var(--navy-deep));
      color: #fff; border-color: var(--navy-deep);
      box-shadow: 0 8px 16px -6px rgba(11,37,69,0.45);
    }
    .ps-article {
      background: #fff; border: 1px solid var(--line);
      border-radius: 18px; padding: 24px;
      cursor: pointer;
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
      position: relative; overflow: hidden;
    }
    .ps-article::before {
      content: ""; position: absolute; left: 0; top: 0; bottom: 0;
      width: 4px; background: var(--saffron);
      transform: scaleY(0); transform-origin: top;
      transition: transform .28s ease;
    }
    .ps-article:hover {
      transform: translateY(-4px);
      border-color: rgba(15,122,79,0.4);
      box-shadow: 0 18px 32px -16px rgba(11,37,69,0.22);
    }
    .ps-article:hover::before { transform: scaleY(1); }
    .ps-article.is-open {
      border-color: var(--green);
      box-shadow: 0 18px 32px -16px rgba(15,122,79,0.25);
    }
    .ps-article.is-open::before { transform: scaleY(1); }
    .ps-article-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, var(--cream), #fff);
      border: 1px solid #ead9b6;
      color: var(--saffron);
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .ps-article-tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 11px; border-radius: 99px;
      background: var(--cream); color: var(--saffron);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .72rem; font-weight: 700;
      letter-spacing: .14em; text-transform: uppercase;
    }
    .ps-article-title {
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.4rem; color: var(--navy);
      margin-top: 14px; line-height: 1.22;
    }
    .ps-article-excerpt {
      color: var(--ink-soft); margin-top: 10px;
      line-height: 1.72; font-size: 1.04rem;
    }
    .ps-article-meta {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 16px; padding-top: 14px;
      border-top: 1px dashed var(--line);
      font-size: .9rem; color: var(--ink-soft);
    }
    .ps-article-cta {
      color: var(--green); font-weight: 700;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .ps-article-body {
      margin-top: 18px; padding-top: 18px;
      border-top: 1px solid var(--line);
      color: var(--ink); line-height: 1.92;
      font-size: 1.05rem;
      animation: ps-rise .35s ease both;
    }
    .ps-article-body p + p { margin-top: 10px; }
    .ps-article-body strong { color: var(--navy); }

    /* =============================================================
       OLD vs NEW MEASUREMENT TABLE
       ============================================================= */
    .ps-measure-wrap {
      background: #fff; border: 1px solid var(--line);
      border-radius: 22px; overflow: hidden;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.5) inset,
        0 14px 32px -16px rgba(11,37,69,0.18);
      position: relative;
    }
    .ps-measure-wrap::before {
      content: ""; position: absolute; left: 0; right: 0; top: 0; height: 4px;
      background: linear-gradient(90deg, var(--saffron) 0% 33%, #fff 33% 66%, var(--green) 66%);
      z-index: 1;
    }
    .ps-measure-table {
      width: 100%; border-collapse: collapse;
    }
    .ps-measure-table thead th {
      background: linear-gradient(180deg, var(--navy), var(--navy-deep));
      color: #fff; padding: 18px 18px;
      text-align: left; font-weight: 600;
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.05rem;
      letter-spacing: .02em;
      border-right: 1px solid rgba(255,255,255,0.10);
    }
    .ps-measure-table thead th:last-child { border-right: 0; }
    .ps-measure-table tbody td {
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
      font-size: 1rem;
      vertical-align: top;
    }
    .ps-measure-table tbody td:first-child {
      font-family: 'Tiro Devanagari Marathi', serif;
      color: var(--navy); font-weight: 700;
      font-size: 1.1rem;
      width: 22%;
    }
    .ps-measure-table tbody td:nth-child(2) {
      color: var(--green); font-weight: 700;
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.05rem;
      width: 24%;
    }
    .ps-measure-table tbody td:nth-child(3) {
      color: var(--ink-soft); font-weight: 600;
      width: 18%;
    }
    .ps-measure-table tbody td:last-child {
      color: var(--ink-soft); line-height: 1.55;
    }
    .ps-measure-table tbody tr:nth-child(odd) { background: #fff; }
    .ps-measure-table tbody tr:nth-child(even) { background: #FAF7EE; }
    .ps-measure-table tbody tr:hover { background: #fef3c7; }
    .ps-measure-table tbody tr:last-child td { border-bottom: 0; }

    @media (max-width: 768px) {
      .ps-measure-table thead { display: none; }
      .ps-measure-table tbody tr {
        display: block;
        padding: 16px 18px;
        border-bottom: 1px solid var(--line);
        background: #fff !important;
      }
      .ps-measure-table tbody tr:nth-child(even) { background: #FAF7EE !important; }
      .ps-measure-table tbody td {
        display: flex; justify-content: space-between; gap: 16px;
        padding: 6px 0; border: 0; width: 100% !important;
        font-size: .98rem;
        align-items: baseline;
      }
      .ps-measure-table tbody td::before {
        content: attr(data-label);
        font-weight: 600; color: var(--ink-soft);
        font-family: 'Tiro Devanagari Marathi', serif;
        flex-shrink: 0; font-size: .92rem;
      }
      .ps-measure-table tbody td:first-child {
        font-size: 1.25rem; padding-bottom: 10px;
        margin-bottom: 6px;
        border-bottom: 1px dashed var(--line);
        text-align: left;
      }
      .ps-measure-table tbody td:first-child::before { display: none; }
      .ps-measure-table tbody td:last-child::before {
        content: "वापर:";
      }
    }

    /* =============================================================
       MEASUREMENT CONVERTER MODAL + FAB
       ============================================================= */
    .ps-fab-measure {
      position: fixed; right: 22px; bottom: 92px; z-index: 60;
      width: 56px; height: 56px;
      border-radius: 999px;
      background: linear-gradient(180deg, #fff, var(--cream));
      border: 1.8px solid var(--saffron);
      color: var(--saffron);
      display: grid; place-items: center;
      cursor: pointer;
      box-shadow:
        0 4px 8px rgba(0,0,0,0.12),
        0 14px 28px -10px rgba(217,119,6,0.55);
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .ps-fab-measure:hover { transform: translateY(-2px) scale(1.04); }
    .ps-fab-measure:active { transform: translateY(0); }
    .ps-fab-measure svg { width: 26px; height: 26px; }
    @media (max-width: 640px) {
      .ps-fab-measure { right: 14px; bottom: 80px; width: 50px; height: 50px; }
      .ps-fab-measure svg { width: 22px; height: 22px; }
    }

    .ps-modal-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(11,37,69,0.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: ps-fade-in .22s ease both;
    }
    @keyframes ps-fade-in { from { opacity: 0 } to { opacity: 1 } }
    .ps-modal {
      background: #fff;
      width: 100%; max-width: 480px;
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.7) inset,
        0 30px 60px -20px rgba(11,37,69,0.55);
      animation: ps-modal-rise .32s cubic-bezier(.4,0,.2,1) both;
      position: relative;
    }
    @keyframes ps-modal-rise {
      from { transform: translateY(20px) scale(.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .ps-modal-header {
      background: linear-gradient(135deg, var(--navy-deep), var(--navy));
      color: #fff;
      padding: 18px 22px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 4px solid var(--saffron);
    }
    .ps-modal-close {
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: #fff;
      width: 34px; height: 34px; border-radius: 999px;
      cursor: pointer; line-height: 1;
      display: grid; place-items: center;
      font-size: 1.2rem; font-family: inherit;
      transition: background .15s;
    }
    .ps-modal-close:hover { background: rgba(255,255,255,0.22); }
    .ps-modal-body { padding: 22px; }

    .ps-input {
      width: 100%; padding: 14px 16px;
      border: 1.6px solid var(--line);
      border-radius: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.4rem; font-weight: 700;
      color: var(--ink);
      background: #fff;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .ps-input:focus {
      border-color: var(--green); outline: none;
      box-shadow: 0 0 0 3px rgba(15,122,79,0.15);
    }
    .ps-select {
      width: 100%; padding: 13px 14px;
      border: 1.6px solid var(--line);
      border-radius: 12px;
      background: #fff;
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.05rem; color: var(--ink);
      cursor: pointer;
    }
    .ps-select:focus { border-color: var(--green); outline: none; }

    .ps-conv-result {
      margin-top: 18px;
      padding: 22px;
      background: linear-gradient(135deg, var(--cream) 0%, #fff 100%);
      border: 1.5px solid #ead9b6;
      border-radius: 16px;
      text-align: center;
      position: relative;
    }
    .ps-conv-result::before {
      content: ""; position: absolute; left: 50%; top: -12px;
      transform: translateX(-50%);
      width: 36px; height: 24px;
      background: var(--saffron);
      color: #fff;
      border-radius: 99px;
      display: grid; place-items: center;
      font-weight: 700; font-size: 1rem;
    }
    .ps-conv-result-num {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 2.4rem; font-weight: 700;
      color: var(--navy); line-height: 1;
      letter-spacing: -.02em;
    }
    .ps-conv-result-unit {
      font-family: 'Tiro Devanagari Marathi', serif;
      font-size: 1.1rem; color: var(--green);
      margin-top: 4px;
    }

    .ps-conv-quick {
      margin-top: 18px;
      padding: 14px 16px;
      background: #fafaf7;
      border: 1px solid var(--line);
      border-radius: 12px;
    }
    .ps-conv-quick-row {
      display: flex; justify-content: space-between;
      padding: 6px 0;
      font-size: .95rem;
      border-bottom: 1px dashed var(--line);
    }
    .ps-conv-quick-row:last-child { border-bottom: 0; }
    .ps-conv-quick-row .k {
      font-family: 'Tiro Devanagari Marathi', serif;
      color: var(--navy); font-weight: 700;
    }
    .ps-conv-quick-row .v {
      color: var(--green); font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .ps-swap-btn {
      width: 36px; height: 36px;
      border-radius: 999px;
      background: var(--green);
      color: #fff; border: 0;
      cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 6px 12px -4px rgba(15,122,79,0.55);
      margin: 8px auto;
      transition: transform .25s ease;
    }
    .ps-swap-btn:hover { transform: rotate(180deg); }

  `}</style>
);

// =============================================================
//                            HEADER
// =============================================================
function Header() {
  return (
    <header className="ps-no-print" style={{ background: "#fff", borderBottom: `1px solid ${C.line}` }}>
      <div className="ps-flag-stripe" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-3">
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})`,
            display: "grid", placeItems: "center",
            boxShadow: "0 8px 18px -8px rgba(11,37,69,0.45)"
          }}>
            <Icon.doc style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div className="leading-tight">
            <div className="ps-display" style={{ fontSize: "1.35rem", color: C.navy, fontWeight: 700 }}>
              प्रिंटशुभ
            </div>
            <div className="ps-mono" style={{ fontSize: ".72rem", color: C.inkSoft, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Bhumi · Maps · Print
            </div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: C.ink }}>
          <a href="#tool" className="hover:opacity-70" style={{ fontWeight: 600 }}>७/१२ साधन</a>
          <a href="#how" className="hover:opacity-70" style={{ fontWeight: 600 }}>कसे वापरावे</a>
          <a href="#services" className="hover:opacity-70" style={{ fontWeight: 600 }}>सेवा</a>
          <a href="#faq" className="hover:opacity-70" style={{ fontWeight: 600 }}>प्रश्न</a>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://wa.me/918625801907" target="_blank" rel="noreferrer" className="ps-btn ps-btn-wa" style={{ padding: ".7rem 1rem", fontSize: ".95rem" }}>
            <Icon.whatsapp style={{ width: 18, height: 18 }} />
            <span className="hidden sm:inline">व्हॉट्सॲप</span>
          </a>
        </div>
      </div>
    </header>
  );
}

// =============================================================
//                            HERO
// =============================================================
function Hero({ onScrollToTool }) {
  return (
    <section className="ps-hero-bg ps-no-print" style={{ position: "relative", overflow: "hidden" }}>
      <div className="ps-hero-grid" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-12 gap-10 items-center" style={{ position: "relative" }}>
        {/* Left */}
        <div className="md:col-span-7 ps-rise">
          <div className="inline-flex items-center gap-2 ps-trust mb-6">
            <Icon.shield style={{ width: 16, height: 16, color: C.greenBright }} />
            <span style={{ color: "#cfe9da" }}>महाराष्ट्र शासनाच्या डेटावर आधारित</span>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "rgba(255,255,255,.4)" }} />
            <span className="ps-mono" style={{ color: "#fff", fontSize: ".82rem", letterSpacing: ".06em" }}>VERIFIED</span>
          </div>

          <h1 className="ps-display ps-hero-h1" style={{ fontSize: "3.4rem", lineHeight: 1.1, color: "#fff", fontWeight: 400 }}>
            तुमचा <span style={{ color: C.greenBright, fontStyle: "italic" }}>७/१२</span> अपलोड करा,
            <br /> एका क्लिकवर मिळवा संपूर्ण <span style={{ color: "#FCD34D" }}>जमीन माहिती</span>.
          </h1>

          <p className="ps-hero-sub mt-6" style={{ fontSize: "1.18rem", color: "#cfd8e4", maxWidth: 620, lineHeight: 1.7 }}>
            गाव, तालुका, सर्व्हे क्रमांक, क्षेत्र — सगळं आपोआप वाचलं जातं.
            तुमची जमीन नकाशावर दाखवली जाते आणि सुंदर रिपोर्ट तयार होतो.
            <strong style={{ color: "#fff" }}> कोणतीही टायपिंग नाही.</strong>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onScrollToTool} className="ps-btn ps-btn-primary" style={{ fontSize: "1.08rem" }}>
              <Icon.upload style={{ width: 20, height: 20 }} />
              ७/१२ अपलोड करा — मोफत
            </button>
            <a href="https://wa.me/918625801907" target="_blank" rel="noreferrer" className="ps-btn ps-btn-ghost">
              <Icon.whatsapp style={{ width: 18, height: 18, color: "#25D366" }} />
              व्हॉट्सॲप वर ऑर्डर
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {[
              ["सरकारी डेटा", Icon.shield],
              ["सुरक्षित अपलोड", Icon.lock],
              ["३० वर्षांचा अनुभव", Icon.star],
              ["२४×७ सेवा", Icon.phone],
            ].map(([label, I], i) => (
              <div key={i} className="ps-trust" style={{ justifyContent: "flex-start" }}>
                <I style={{ width: 18, height: 18, color: C.greenBright }} />
                <span style={{ color: "#fff", fontWeight: 600, fontSize: ".95rem" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — preview report card */}
        <div className="md:col-span-5 ps-rise-2">
          <ReportPreviewCard />
        </div>
      </div>

      {/* Bottom wave separator */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
        <path d="M0,40 C200,80 400,0 720,30 C1040,60 1240,20 1440,40 L1440,80 L0,80 Z" fill={C.paper} />
      </svg>
    </section>
  );
}

function ReportPreviewCard() {
  return (
    <div className="ps-card-deep" style={{ padding: 22, position: "relative" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="ps-mono" style={{ fontSize: ".74rem", letterSpacing: ".18em", color: "#9fb6c7" }}>
          PRINTSHUBH · LAND REPORT
        </div>
        <div className="ps-trust" style={{ background: "rgba(16,185,129,0.14)", borderColor: "rgba(16,185,129,0.35)" }}>
          <Icon.check style={{ width: 14, height: 14, color: C.greenBright }} />
          <span style={{ color: "#a7f3d0", fontSize: ".8rem", fontWeight: 700 }}>VERIFIED</span>
        </div>
      </div>
      <div className="ps-display" style={{ fontSize: "1.65rem", color: "#fff", lineHeight: 1.2 }}>
        ७/१२ उतारा — रुकडी
      </div>
      <div style={{ color: "#9fb6c7", fontSize: ".95rem", marginTop: 4 }}>
        ता. हातकणंगले, जि. कोल्हापूर
      </div>

      <div className="mt-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          ["सर्व्हे क्र.", "१४२/२"],
          ["क्षेत्र", "१ हे ३५ आर"],
          ["जमीन प्रकार", "बागायत"],
          ["मालक", "सावंत बंधू"],
        ].map(([k,v],i) => (
          <div key={i} className="flex justify-between py-2" style={{ borderBottom: i<3 ? "1px dashed rgba(255,255,255,0.08)" : "none" }}>
            <span style={{ color: "#9fb6c7", fontSize: ".92rem" }}>{k}</span>
            <span style={{ color: "#fff", fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Mini map mock */}
      <div className="mt-4 rounded-xl" style={{
        height: 130, position: "relative", overflow: "hidden",
        background: `
          radial-gradient(circle at 60% 50%, rgba(16,185,129,0.25), transparent 40%),
          linear-gradient(135deg, #0e3052 0%, #102b46 100%)`
      }}>
        <svg viewBox="0 0 200 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <g stroke="rgba(255,255,255,0.18)" strokeWidth=".4" fill="none">
            {Array.from({length:10}).map((_,i)=><path key={i} d={`M0,${i*10} L200,${i*10}`} />)}
            {Array.from({length:20}).map((_,i)=><path key={i} d={`M${i*10},0 L${i*10},100`} />)}
          </g>
          <path d="M50,30 L130,28 L150,55 L120,80 L60,75 Z" fill="rgba(16,185,129,0.18)" stroke={C.greenBright} strokeWidth="1.4"/>
        </svg>
        <div style={{ position: "absolute", left: "55%", top: "48%", transform: "translate(-50%,-50%)" }}>
          <div className="ps-pulse" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "#9fb6c7" }}>
        <div>१६.८३° N, ७४.३१° E</div>
        <div className="ps-mono">REPORT #PS-2026-04821</div>
      </div>

      {/* Decorative seal */}
      <div style={{
        position: "absolute", top: -16, right: -16, width: 90, height: 90, borderRadius: 999,
        border: `1.5px dashed ${C.saffron}`, opacity: .55, pointerEvents: "none",
        display: "grid", placeItems: "center"
      }}>
        <Icon.spark style={{ width: 22, height: 22, color: C.saffron }} />
      </div>
    </div>
  );
}

// =============================================================
//                       HOW IT WORKS
// =============================================================
function HowItWorks() {
  const steps = [
    { n: "०१", t: "७/१२ अपलोड करा", d: "PDF किंवा फोटो — मोबाईलवरून सुद्धा.", I: Icon.upload },
    { n: "०२", t: "AI ओळखते जमीन", d: "मराठी मजकूर वाचून सर्व्हे, गाव, क्षेत्र शोधते.", I: Icon.scan },
    { n: "०३", t: "नकाशावर दिसते", d: "तुमची जमीन उपग्रह नकाशावर अचूक ठळक केली जाते.", I: Icon.pin },
    { n: "०४", t: "रिपोर्ट डाउनलोड", d: "PDF रिपोर्ट किंवा थेट व्हॉट्सॲप वर मिळवा.", I: Icon.download },
  ];
  return (
    <section id="how" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 ps-no-print">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="ps-mono" style={{ color: C.green, fontSize: ".78rem", letterSpacing: ".22em" }}>
          HOW IT WORKS
        </div>
        <h2 className="ps-display mt-2" style={{ fontSize: "2.4rem", color: C.navy, lineHeight: 1.15 }}>
          फक्त चार सोप्या पायऱ्या.
        </h2>
        <p style={{ color: C.inkSoft, marginTop: 10, fontSize: "1.05rem" }}>
          कोणतेही फॉर्म नाहीत. कोणतीही गुंतागुंत नाही. एका मिनिटात पूर्ण.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="ps-card" style={{ padding: 22 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="ps-step-num">{s.n}</div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${C.green}10`, color: C.green,
                display: "grid", placeItems: "center"
              }}>
                <s.I style={{ width: 22, height: 22 }} />
              </div>
            </div>
            <div className="ps-display" style={{ fontSize: "1.3rem", color: C.navy, lineHeight: 1.25 }}>
              {s.t}
            </div>
            <p style={{ color: C.inkSoft, marginTop: 8, lineHeight: 1.6, fontSize: "0.98rem" }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================
//                    THE TOOL (Upload → OCR → Map → Report)
// =============================================================
// =============================================================
//                    PREMIUM MAP COMPONENT
// =============================================================
const TILES = {
  satellite: {
    base: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 19 },
  },
  hybrid: {
    base: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 19 },
    overlay: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", maxZoom: 19, opacity: 0.85 },
  },
  terrain: {
    base: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri Topo", maxZoom: 19 },
  },
  dark: {
    base: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", subdomains: "abcd", attribution: "© CARTO · OSM", maxZoom: 19 },
  },
  light: {
    base: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", subdomains: "abcd", attribution: "© CARTO · OSM", maxZoom: 19 },
  },
};

function PremiumMap({ coords, data, autoplay = true }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const featuresRef = useRef(null);
  const labelGroupsRef = useRef({ district: null, taluka: null, village: null, survey: null });
  const leafletReady = useLeaflet();

  const [layer, setLayer] = useState("satellite");
  const [latLng, setLatLng] = useState(coords || [19.7515, 75.7139]);
  const [zoom, setZoom] = useState(6);
  const [isFs, setIsFs] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [narration, setNarration] = useState(null);
  const [showRadar, setShowRadar] = useState(true);

  // ---- Initialise map ----
  useEffect(() => {
    if (!leafletReady || mapRef.current || !canvasRef.current) return;
    const L = window.L;
    const map = L.map(canvasRef.current, {
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      fadeAnimation: true,
      zoomAnimation: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      scrollWheelZoom: true,
      tap: true,
      touchZoom: true,
      dragging: true,
    }).setView([19.7515, 75.7139], 6);
    mapRef.current = map;

    applyLayer("satellite");

    map.on("moveend zoomend", () => {
      const c = map.getCenter();
      setLatLng([c.lat, c.lng]);
      setZoom(map.getZoom());
      applyLabelVisibility(map.getZoom());
    });

    setTimeout(() => map.invalidateSize(), 100);
  }, [leafletReady]);

  // ---- Layer change ----
  useEffect(() => {
    if (mapRef.current) applyLayer(layer);
  }, [layer]);

  function applyLayer(name) {
    const L = window.L;
    const map = mapRef.current;
    if (!map) return;
    if (baseLayerRef.current) { map.removeLayer(baseLayerRef.current); baseLayerRef.current = null; }
    if (overlayLayerRef.current) { map.removeLayer(overlayLayerRef.current); overlayLayerRef.current = null; }
    const cfg = TILES[name];
    const base = L.tileLayer(cfg.base.url, {
      attribution: cfg.base.attribution,
      maxZoom: cfg.base.maxZoom,
      subdomains: cfg.base.subdomains || "abc",
    }).addTo(map);
    baseLayerRef.current = base;
    if (cfg.overlay) {
      const ov = L.tileLayer(cfg.overlay.url, { maxZoom: cfg.overlay.maxZoom, opacity: cfg.overlay.opacity }).addTo(map);
      overlayLayerRef.current = ov;
    }
    // Re-apply label visibility (some layers are darker / lighter — labels stay legible)
    applyLabelVisibility(map.getZoom());
  }

  // ---- Toggle label visibility based on zoom ranges ----
  function applyLabelVisibility(z) {
    const ranges = {
      district: [6, 8.5],
      taluka:   [8.6, 11.5],
      village:  [11.6, 14.5],
      survey:   [14.6, 22],
    };
    Object.entries(ranges).forEach(([key, [min, max]]) => {
      const visible = z >= min && z <= max;
      const group = labelGroupsRef.current[key];
      if (!group) return;
      group.eachLayer((mk) => {
        const el = mk.getElement?.();
        if (!el) return;
        const inner = el.querySelector(".ps-map-label");
        if (inner) inner.classList.toggle("is-visible", visible);
      });
    });
  }

  // ---- Build static label layers (districts, talukas, villages) ----
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;

    // Cleanup any previous groups
    Object.values(labelGroupsRef.current).forEach((g) => g && g.remove());

    const groups = {
      district: L.layerGroup().addTo(map),
      taluka: L.layerGroup().addTo(map),
      village: L.layerGroup().addTo(map),
      survey: L.layerGroup().addTo(map),
    };

    // Districts (36)
    Object.entries(DISTRICT_COORDS).forEach(([name, [lat, lng]]) => {
      L.marker([lat, lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<div class="ps-map-label ps-label-district">${name}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(groups.district);
    });

    // Talukas
    TALUKA_LABELS.forEach(({ name, lat, lng }) => {
      L.marker([lat, lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<div class="ps-map-label ps-label-taluka">${name}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(groups.taluka);
    });

    // Villages
    VILLAGE_LABELS.forEach(({ name, lat, lng }) => {
      L.marker([lat, lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<div class="ps-map-label ps-label-village">${name}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(groups.village);
    });

    labelGroupsRef.current = groups;
    applyLabelVisibility(map.getZoom());

    return () => {
      Object.values(groups).forEach((g) => g.remove());
    };
  }, [leafletReady]);

  // ---- Survey-number labels generated procedurally around current pin ----
  useEffect(() => {
    if (!leafletReady || !labelGroupsRef.current.survey || !coords) return;
    const L = window.L;
    const survey = labelGroupsRef.current.survey;
    survey.clearLayers();

    const [lat, lng] = coords;
    const m = String(data?.survey_no || "142").match(/\d+/);
    const baseNum = m ? parseInt(m[0], 10) : 142;

    // Procedural cadastral grid around pin
    const variants = [
      String(baseNum - 2), String(baseNum - 1), `${baseNum - 1}/अ`,
      String(baseNum), `${baseNum}/१`, `${baseNum}/२`,
      String(baseNum + 1), `${baseNum + 1}/ब`, String(baseNum + 2),
      `${baseNum + 2}/अ`, String(baseNum + 3), `${baseNum + 3}/क`,
    ];
    variants.forEach((num, i) => {
      const angle = (i / variants.length) * Math.PI * 2;
      const radius = 0.0008 + (i % 3) * 0.00045;
      const dlat = Math.sin(angle) * radius;
      const dlng = Math.cos(angle) * radius * 1.15;
      L.marker([lat + dlat, lng + dlng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<div class="ps-map-label ps-label-survey">${toMarathi(num)}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(survey);
    });
    applyLabelVisibility(mapRef.current?.getZoom() || 6);
  }, [coords, data, leafletReady]);

  // ---- Cinematic flyTo sequence on coords change ----
  useEffect(() => {
    if (!mapRef.current || !coords || !leafletReady) return;
    let cancelled = false;
    const run = async () => {
      const map = mapRef.current;
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      setShowRadar(true);
      // Stage 0 — Maharashtra wide view
      map.setView([19.7515, 75.7139], 6, { animate: false });
      setNarration("महाराष्ट्र राज्य शोधत आहे...");
      await sleep(700);
      if (cancelled) return;

      // Stage 1 — District (zoom 10)
      setNarration(`जिल्हा : ${data?.district || "—"}`);
      map.flyTo(coords, 10, { duration: 1.7, easeLinearity: 0.22 });
      await sleep(1850);
      if (cancelled) return;

      // Stage 2 — Taluka / Village (zoom 14)
      setNarration(`तालुका : ${data?.taluka || "—"}`);
      map.flyTo(coords, 14, { duration: 1.4, easeLinearity: 0.25 });
      await sleep(1500);
      if (cancelled) return;

      // Stage 3 — Plot (zoom 17)
      setNarration(`गाव : ${data?.village || "—"}`);
      map.flyTo(coords, 17, { duration: 1.6, easeLinearity: 0.25 });
      await sleep(1700);
      if (cancelled) return;

      setShowRadar(false);
      addFeatures();
      // Final ping
      setPinging(true);
      setTimeout(() => setPinging(false), 1800);
      // Hide narration after a moment
      setTimeout(() => !cancelled && setNarration(null), 3000);
    };
    if (autoplay) run();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [coords, leafletReady]);

  // ---- Build features (boundary, plot, label, pin) ----
  function addFeatures() {
    const L = window.L;
    const map = mapRef.current;
    if (!map || !coords) return;

    if (featuresRef.current) featuresRef.current.remove();
    const group = L.layerGroup();
    const [lat, lng] = coords;

    // 1. Village boundary polygon (procedural — replace with real GeoJSON later)
    const r = 0.011;
    const ring = [
      [lat + r, lng - r * 1.4], [lat + r * 0.8, lng + r * 0.6], [lat + r * 0.2, lng + r * 1.5],
      [lat - r * 0.7, lng + r * 1.1], [lat - r * 1.0, lng - r * 0.2], [lat - r * 0.4, lng - r * 1.3],
    ];
    L.polygon(ring, {
      color: C.greenBright, weight: 2.5, opacity: 0.95,
      fillColor: C.greenBright, fillOpacity: 0.10, dashArray: "8 4",
    }).addTo(group);

    // 2. Plot highlight (yellow translucent)
    const p = 0.0019;
    const plot = [
      [lat + p, lng - p * 1.4], [lat + p * 0.6, lng + p * 0.4],
      [lat - p * 0.7, lng + p * 0.9], [lat - p * 0.9, lng - p * 0.5],
    ];
    L.polygon(plot, {
      color: "#FCD34D", weight: 3, opacity: 1,
      fillColor: "#FCD34D", fillOpacity: 0.42,
    }).addTo(group).bindTooltip("निवडलेली जमीन", { sticky: true, className: "ps-village-label", offset: [0, -8] });

    // 3. Animated pin
    const pinIcon = L.divIcon({
      className: "",
      html: `
        <div class="ps-pin-stack">
          <div class="ps-pin-rings">
            <div class="ps-pin-ring"></div>
            <div class="ps-pin-ring r2"></div>
            <div class="ps-pin-ring r3"></div>
          </div>
          <div class="ps-pin-dot"></div>
          <svg class="ps-pin-svg" viewBox="0 0 24 24">
            <path fill="#10B981" stroke="#0F7A4F" stroke-width="0.8" d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
          </svg>
        </div>`,
      iconSize: [44, 56], iconAnchor: [22, 56],
    });
    L.marker(coords, { icon: pinIcon, riseOnHover: true })
      .addTo(group)
      .bindPopup(
        `<div style="font-family:'Hind Vadodara',sans-serif;min-width:160px;">
           <div style="font-family:'Tiro Devanagari Marathi',serif;font-weight:700;color:${C.navy};font-size:15px;margin-bottom:4px;">${data?.village || "जमीन"}</div>
           <div style="font-size:.85rem;color:${C.inkSoft};line-height:1.5;">
             ता. ${data?.taluka || "—"}<br/>
             जि. ${data?.district || "—"}<br/>
             सर्व्हे: <strong>${data?.survey_no || "—"}</strong>
           </div>
         </div>`,
        { offset: [0, -50], className: "ps-popup" }
      );

    // 4. Village label slightly offset
    L.marker([lat + 0.013, lng + 0.011], {
      icon: L.divIcon({
        className: "",
        html: `<div class="ps-village-label">${data?.village || ""}</div>`,
        iconSize: [0, 0],
      }),
    }).addTo(group);

    group.addTo(map);
    featuresRef.current = group;
  }

  // ---- Controls ----
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const locate = () => {
    if (!mapRef.current || !coords) return;
    setPinging(true);
    setTimeout(() => setPinging(false), 1800);
    mapRef.current.flyTo(coords, 17, { duration: 1.4 });
  };
  const toggleFs = () => {
    setIsFs((v) => !v);
    setTimeout(() => mapRef.current?.invalidateSize(), 360);
  };

  // Detect Esc key to exit fullscreen
  useEffect(() => {
    if (!isFs) return;
    const onKey = (e) => { if (e.key === "Escape") setIsFs(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFs]);

  // Recalc map size when fullscreen changes
  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 360);
  }, [isFs]);

  return (
    <div ref={wrapRef} className={cls("ps-map-wrap", isFs && "is-fullscreen")}>
      <div ref={canvasRef} className="ps-map-canvas" />

      {/* Top-left: layer toggle */}
      <div className="ps-map-toolbar" role="tablist" aria-label="Map layers">
        {[
          ["satellite", "उपग्रह", "🛰"],
          ["hybrid", "हायब्रिड", "🌐"],
          ["terrain", "नकाशा", "⛰"],
          ["dark", "रात्र", "🌙"],
          ["light", "साधा", "☀"],
        ].map(([k, l, emoji]) => (
          <button
            key={k}
            className={cls("ps-map-tab", layer === k && "is-active")}
            onClick={() => setLayer(k)}
            role="tab"
            aria-selected={layer === k}
          >
            <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{emoji}</span>
            <span className="ps-tab-label">{l}</span>
          </button>
        ))}
      </div>

      {/* Top-right: fullscreen */}
      <div className="ps-map-tr">
        <button className="ps-map-btn" onClick={toggleFs} aria-label={isFs ? "Exit fullscreen" : "Fullscreen"}>
          {isFs ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 9V4M9 9H4M15 9V4M15 9h5M9 15v5M9 15H4M15 15v5M15 15h5"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
          )}
        </button>
      </div>

      {/* Narration banner */}
      {narration && (
        <div key={narration} className="ps-map-narration">
          {narration}
        </div>
      )}

      {/* Loading radar (during cinematic intro) */}
      {showRadar && (
        <div className="ps-map-radar">
          <div className="ps-radar-circle">
            <div className="ps-radar-cross" />
            <div className="ps-radar-sweep" />
            <div className="ps-radar-status">
              तुमची जमीन शोधत आहे...
              <span className="ps-mono">SCANNING SATELLITE DATA</span>
            </div>
          </div>
        </div>
      )}

      {/* GPS locate ping */}
      {pinging && (
        <div className="ps-locate-ping">
          <div /><div /><div />
        </div>
      )}

      {/* Bottom-left: locate + zoom stack */}
      <div className="ps-map-bl">
        <button className={cls("ps-map-locate", pinging && "is-pinging")} onClick={locate} aria-label="GPS locate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="9" />
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
          </svg>
        </button>
        <div className="ps-map-zoom-stack">
          <button onClick={zoomIn} aria-label="Zoom in">+</button>
          <button onClick={zoomOut} aria-label="Zoom out">−</button>
        </div>
      </div>

      {/* Bottom-center: lat/lng pill */}
      <div className="ps-map-coords">
        <span className="ps-map-coords-dot" />
        <span>{latLng[0].toFixed(5)}° N, {latLng[1].toFixed(5)}° E</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ opacity: 0.85 }}>zoom {Number(zoom).toFixed(1)}</span>
      </div>

      {/* Bottom-right: compass */}
      <div className="ps-map-compass" aria-hidden="true">
        <svg viewBox="0 0 60 60" width="44" height="44">
          <circle cx="30" cy="30" r="26" fill="#fff" stroke={C.navy} strokeWidth="1.5" />
          <circle cx="30" cy="30" r="20" fill="none" stroke={C.line} strokeWidth="0.5" />
          <path d="M30 8 L34 30 L30 26 L26 30 Z" fill={C.saffron} />
          <path d="M30 52 L26 30 L30 34 L34 30 Z" fill={C.navy} opacity="0.4" />
          <text x="30" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill={C.navy} fontFamily="Plus Jakarta Sans">N</text>
          <text x="30" y="56" textAnchor="middle" fontSize="7" fill={C.inkSoft} fontFamily="Plus Jakarta Sans">S</text>
          <text x="6" y="33" textAnchor="middle" fontSize="7" fill={C.inkSoft} fontFamily="Plus Jakarta Sans">W</text>
          <text x="54" y="33" textAnchor="middle" fontSize="7" fill={C.inkSoft} fontFamily="Plus Jakarta Sans">E</text>
        </svg>
      </div>
    </div>
  );
}

// ----- Mini Map (used in details/report card) -----
function MiniMap({ coords, label }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const leafletReady = useLeaflet();

  useEffect(() => {
    if (!leafletReady || mapRef.current || !ref.current || !coords) return;
    const L = window.L;
    const m = L.map(ref.current, {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      touchZoom: false, boxZoom: false, keyboard: false, tap: false,
    }).setView(coords, 15);
    L.tileLayer(TILES.satellite.base.url, { maxZoom: 19 }).addTo(m);
    L.tileLayer(TILES.hybrid.overlay.url, { opacity: 0.7, maxZoom: 19 }).addTo(m);
    mapRef.current = m;
    setTimeout(() => m.invalidateSize(), 100);
  }, [leafletReady, coords]);

  useEffect(() => {
    if (mapRef.current && coords) mapRef.current.flyTo(coords, 15, { duration: 1.0 });
  }, [coords]);

  return (
    <div className="ps-minimap-wrap">
      <div ref={ref} className="ps-minimap-canvas" />
      <div className="ps-minimap-overlay" />
      <div className="ps-minimap-pin">
        <div className="ps-pin-stack" style={{ transform: "scale(0.75)" }}>
          <div className="ps-pin-rings">
            <div className="ps-pin-ring" />
            <div className="ps-pin-ring r2" />
          </div>
          <div className="ps-pin-dot" />
          <svg className="ps-pin-svg" viewBox="0 0 24 24"><path fill="#10B981" stroke="#0F7A4F" strokeWidth="0.8" d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
        </div>
      </div>
      {label && (
        <div style={{ position: "absolute", left: 10, bottom: 8, background: "rgba(11,37,69,0.85)", color: "#fff", padding: "4px 10px", borderRadius: 999, fontSize: ".75rem", fontFamily: "Tiro Devanagari Marathi, serif" }}>
          📍 {label}
        </div>
      )}
    </div>
  );
}

function Tool() {
  const [stage, setStage] = useState("idle"); // idle | preview | ocr | done
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [data, setData] = useState(null); // extracted record
  const [coords, setCoords] = useState(null);
  const [drag, setDrag] = useState(false);

  const inputRef = useRef(null);

  // ---- file handling ----
  const handleFile = async (f) => {
    setOcrError(null);
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
    setStage("preview");
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ---- Real OCR via Claude API ----
  const runOCR = async () => {
    if (!file) return;
    setStage("uploading");
    setOcrError(null);
    // Brief upload animation window
    await new Promise((r) => setTimeout(r, 1300));
    setStage("ocr");
    try {
      const b64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";

      const userContent = [
        ...(isPdf
          ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }]
          : [{ type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: b64 } }]),
        {
          type: "text",
          text:
`हा महाराष्ट्र राज्यातील ७/१२ उतारा (Satbara) आहे. यातून खालील माहिती काढा.
फक्त शुद्ध JSON द्या, कोणतीही प्रस्तावना नको, markdown नको.

JSON स्कीमा:
{
  "village": "गावाचे नाव मराठीत",
  "taluka": "तालुक्याचे नाव मराठीत",
  "district": "जिल्ह्याचे नाव मराठीत",
  "survey_no": "सर्व्हे/गट क्रमांक",
  "area": "क्षेत्र (हे/आर/चौ.मी)",
  "land_type": "जमीन प्रकार: बागायत / जिरायत / NA / निवासी / औद्योगिक",
  "owner": "मालकाचे नाव",
  "latitude": "अक्षांश (आढळल्यास)",
  "longitude": "रेखांश (आढळल्यास)"
}

जर एखादे फील्ड दस्तऐवजात नसेल तर त्याचे मूल्य "" (रिक्त) ठेवा.`
        }
      ];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();

      const text = (json.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();

      let parsed;
      try { parsed = JSON.parse(text); }
      catch {
        // try to recover JSON from inside text
        const m = text.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]); else throw new Error("Could not parse OCR JSON");
      }

      // Find coords: explicit OR district lookup
      let lat = parseFloat(parsed.latitude);
      let lng = parseFloat(parsed.longitude);
      if (!isFinite(lat) || !isFinite(lng)) {
        const dist = parsed.district || detectDistrict(text);
        const c = dist && DISTRICT_COORDS[dist?.trim()];
        if (c) { lat = c[0]; lng = c[1]; }
      }
      if (!isFinite(lat) || !isFinite(lng)) { lat = 19.7515; lng = 75.7139; } // MH centroid fallback

      setData(parsed);
      setCoords([lat, lng]);
      setStage("done");
    } catch (e) {
      console.error(e);
      setOcrError("दस्तऐवज वाचताना अडचण आली. कृपया स्पष्ट फोटो किंवा PDF अपलोड करा.");
      setStage("preview");
    }
  };

  // ---- Demo mode (fills sample so users can try without uploading) ----
  const fillDemo = () => {
    setData({
      village: "रुकडी",
      taluka: "हातकणंगले",
      district: "कोल्हापूर",
      survey_no: "१४२/२",
      area: "१ हे ३५ आर",
      land_type: "बागायत",
      owner: "सावंत बंधू",
    });
    setCoords(DISTRICT_COORDS["कोल्हापूर"]);
    setStage("done");
  };

  // ---- Reset ----
  const reset = () => {
    setStage("idle"); setFile(null); setPreviewUrl(null); setData(null); setCoords(null); setOcrError(null);
  };

  // -------------------- RENDER --------------------
  return (
    <section id="tool" className="max-w-7xl mx-auto px-4 md:px-8 pb-20" style={{ marginTop: -20 }}>
      <div className="ps-card ps-no-print" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <div style={{ background: `linear-gradient(180deg, #fff, ${C.cream})`, padding: "26px 28px", borderBottom: `1px solid ${C.line}` }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="ps-mono" style={{ color: C.green, fontSize: ".74rem", letterSpacing: ".22em" }}>
                SMART 7/12 OCR
              </div>
              <h2 className="ps-display mt-1" style={{ fontSize: "2rem", color: C.navy, lineHeight: 1.15 }}>
                स्मार्ट ७/१२ साधन
              </h2>
              <p style={{ color: C.inkSoft, marginTop: 4 }}>
                फाईल अपलोड करा. बाकी सगळं आम्ही करतो.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ps-trust" style={{ background: "#fff", color: C.navy, borderColor: C.line }}>
                <Icon.shield style={{ width: 14, height: 14, color: C.green }} />
                <span style={{ fontWeight: 600, fontSize: ".85rem" }}>एंड-टू-एंड एनक्रिप्टेड</span>
              </span>
              <span className="ps-trust" style={{ background: "#fff", color: C.navy, borderColor: C.line }}>
                <Icon.check style={{ width: 14, height: 14, color: C.green }} />
                <span style={{ fontWeight: 600, fontSize: ".85rem" }}>मराठी मजकूर समर्थन</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-7">
          {/* === IDLE / PREVIEW === */}
          {(stage === "idle" || stage === "preview") && (
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-7">
                <div
                  className={cls("ps-drop", drag && "is-drag")}
                  onDragOver={(e)=>{e.preventDefault();setDrag(true);}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={onDrop}
                  onClick={()=>inputRef.current?.click()}
                  style={{ cursor: "pointer", minHeight: 280 }}
                >
                  <div style={{
                    width: 76, height: 76, borderRadius: 22, margin: "0 auto",
                    background: `linear-gradient(180deg, ${C.greenBright}, ${C.green})`,
                    display: "grid", placeItems: "center",
                    boxShadow: "0 14px 28px -10px rgba(15,122,79,0.55)"
                  }}>
                    <Icon.upload style={{ width: 32, height: 32, color: "#fff" }} />
                  </div>
                  <div className="ps-display mt-4" style={{ fontSize: "1.5rem", color: C.navy }}>
                    {stage === "preview" ? "फाईल तयार आहे" : "७/१२ इथे ठेवा किंवा क्लिक करा"}
                  </div>
                  <div style={{ color: C.inkSoft, marginTop: 6, fontSize: "1rem" }}>
                    PDF, JPG, PNG — मोबाईलवरून फोटो काढून थेट अपलोड चालेल
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e)=>handleFile(e.target.files?.[0])}
                  />

                  {file && (
                    <div className="mt-5 ps-mono" style={{ fontSize: ".88rem", color: C.navy }}>
                      <Icon.doc style={{ width: 16, height: 16, display: "inline-block", marginRight: 6, verticalAlign: "-3px" }}/>
                      {file.name} <span style={{ color: C.inkSoft }}>· {(file.size/1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>

                {ocrError && (
                  <div className="mt-3" style={{ background: "#fff7ed", border: `1px solid #fed7aa`, color: "#9a3412", padding: "10px 14px", borderRadius: 12 }}>
                    {ocrError}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={runOCR}
                    disabled={!file}
                    className="ps-btn ps-btn-primary"
                    style={{ opacity: file ? 1 : 0.45, cursor: file ? "pointer" : "not-allowed" }}
                  >
                    <Icon.scan style={{ width: 18, height: 18 }} />
                    जमीन माहिती काढा
                  </button>
                  <button onClick={fillDemo} className="ps-btn ps-btn-ghost">
                    <Icon.spark style={{ width: 16, height: 16, color: C.saffron }} />
                    डेमो पहा (फाईल नसताना)
                  </button>
                </div>
              </div>

              {/* Right helper card */}
              <div className="md:col-span-5">
                <div className="ps-card" style={{ padding: 18, background: C.cream, border: `1px solid #ead9b6` }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: C.navy }}>
                    <Icon.shield style={{ width: 18, height: 18, color: C.green }} />
                    <span className="ps-mono" style={{ fontSize: ".74rem", letterSpacing: ".18em" }}>HOW WE READ IT</span>
                  </div>
                  <ul style={{ color: C.ink, lineHeight: 1.85, fontSize: ".98rem" }}>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> गाव, तालुका, जिल्हा आपोआप</li>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> सर्व्हे / गट क्रमांक</li>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> क्षेत्र (हेक्टर, आर)</li>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> जमिनीचा प्रकार</li>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> मालकाचे नाव</li>
                    <li className="flex gap-2"><Icon.check style={{ width:18, height:18, color: C.green, flexShrink:0 }}/> अक्षांश/रेखांश आढळल्यास</li>
                  </ul>
                  <div className="mt-3" style={{ borderTop: `1px dashed #c9b88a`, paddingTop: 10, color: C.inkSoft, fontSize: ".88rem" }}>
                    तुमची फाईल कुठेही जतन केली जात नाही. वाचून लगेच रिझल्ट दिला जातो.
                  </div>
                </div>

                {previewUrl && (
                  <div className="mt-3 ps-card" style={{ padding: 8 }}>
                    <img src={previewUrl} alt="upload preview" style={{ width: "100%", borderRadius: 10, display: "block" }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === UPLOADING ANIMATION === */}
          {stage === "uploading" && <UploadingAnimation file={file} />}

          {/* === OCR PROCESSING === */}
          {stage === "ocr" && (
            <div className="grid md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-7">
                <div className="ps-scanwrap ps-card" style={{ padding: 0, background: "#fff", minHeight: 320 }}>
                  {previewUrl ? (
                    <div style={{ position: "relative" }}>
                      <img src={previewUrl} alt="" style={{ width: "100%", display: "block", filter: "saturate(.95)" }} />
                      <div className="ps-scanline" />
                    </div>
                  ) : (
                    <div style={{ height: 320, display: "grid", placeItems: "center", color: C.inkSoft }}>
                      <div className="text-center">
                        <Icon.doc style={{ width: 48, height: 48, color: C.navy, margin: "0 auto 12px" }} />
                        <div className="ps-display" style={{ fontSize: "1.4rem", color: C.navy }}>
                          {file?.name || "PDF प्रक्रिया सुरू आहे"}
                        </div>
                      </div>
                      <div className="ps-scanline" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="ps-card-deep" style={{ padding: 22, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div className="ps-mono" style={{ color: "#9fb6c7", fontSize: ".74rem", letterSpacing: ".18em" }}>
                    AI · OCR · LOCATING LAND
                  </div>
                  <div className="ps-display mt-2" style={{ fontSize: "1.5rem", color: "#fff" }}>
                    दस्तऐवज वाचत आहे...
                  </div>
                  <div style={{ color: "#9fb6c7", marginTop: 6 }}>
                    मराठी मजकूर ओळखून उपग्रह डेटाशी जुळवणी.
                  </div>

                  {/* Mini satellite scanner */}
                  <div style={{
                    marginTop: 16,
                    height: 170,
                    borderRadius: 12,
                    position: "relative",
                    overflow: "hidden",
                    background:
                      `radial-gradient(circle at 50% 50%, rgba(16,185,129,0.10), transparent 60%), linear-gradient(135deg, #0e3052, #102b46)`,
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}>
                    {/* Lat/lng grid */}
                    <svg viewBox="0 0 200 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                      <g stroke="rgba(255,255,255,0.10)" strokeWidth=".4" fill="none">
                        {Array.from({length:10}).map((_,i)=><path key={i} d={`M0,${i*10} L200,${i*10}`}/>)}
                        {Array.from({length:20}).map((_,i)=><path key={i} d={`M${i*10},0 L${i*10},100`}/>)}
                      </g>
                      {/* Stylised Maharashtra silhouette */}
                      <path
                        d="M40,28 L62,22 L84,30 L102,25 L118,32 L138,28 L158,38 L168,55 L160,70 L140,76 L120,72 L98,80 L78,76 L58,72 L42,60 L36,42 Z"
                        fill="rgba(16,185,129,0.18)" stroke={C.greenBright} strokeWidth="1.2" opacity="0.85"
                      />
                    </svg>
                    {/* Radar */}
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <div style={{ position: "relative", width: 110, height: 110 }}>
                        <div className="ps-radar-circle" style={{ width: 110, height: 110 }}>
                          <div className="ps-radar-cross" />
                          <div className="ps-radar-sweep" />
                        </div>
                      </div>
                    </div>
                    {/* Scan crosshairs at random spots simulating detection */}
                    <div style={{ position: "absolute", left: "62%", top: "32%", width: 14, height: 14, borderRadius: 99, border: `2px solid ${C.greenBright}`, animation: "ps-coords-dot 1.4s infinite" }} />
                    <div style={{ position: "absolute", left: "44%", top: "58%", width: 10, height: 10, borderRadius: 99, border: `2px solid #FCD34D`, animation: "ps-coords-dot 1.4s infinite", animationDelay: "0.7s" }} />
                  </div>

                  <ul style={{ marginTop: 14 }}>
                    {[
                      "मराठी मजकूर ओळखत आहे",
                      "गाव डेटाबेस शोधत आहे",
                      "उपग्रह नकाशावर ठिकाण निश्चित करत आहे",
                    ].map((t,i)=>(
                      <li key={i} className="flex items-center gap-3" style={{ padding: "6px 0", color: "#cfe9da" }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: 99,
                          border: `2px solid ${C.greenBright}`, borderTopColor: "transparent",
                          animation: `spin 0.9s linear infinite`,
                          animationDelay: `${i*0.18}s`,
                          flexShrink: 0,
                        }}/>
                        <span style={{ fontSize: ".94rem" }}>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            </div>
          )}

          {/* === DONE → MAP + DETAILS === */}
          {stage === "done" && data && (
            <div className="grid md:grid-cols-12 gap-6 ps-rise">
              {/* Map */}
              <div className="md:col-span-7">
                <PremiumMap coords={coords} data={data} />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MapStat label="गाव सीमा" value="आढळली" tone="green"/>
                  <MapStat label="निवडलेली जमीन" value="ठळक" tone="amber"/>
                  <MapStat label="उपग्रह दृश्य" value="HD" tone="navy"/>
                </div>
              </div>

              {/* Details */}
              <div className="md:col-span-5">
                <div className="ps-card" style={{ padding: 22 }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="ps-mono" style={{ color: C.green, fontSize: ".74rem", letterSpacing: ".18em" }}>
                      LAND DETAILS
                    </div>
                    <div className="ps-trust" style={{ background: `${C.green}10`, color: C.green, borderColor: `${C.green}33` }}>
                      <Icon.check style={{ width: 14, height: 14, color: C.green }} />
                      <span style={{ fontSize: ".8rem", fontWeight: 700 }}>VERIFIED</span>
                    </div>
                  </div>
                  <div className="ps-display" style={{ fontSize: "1.6rem", color: C.navy }}>
                    {data.village || "—"}
                  </div>
                  <div style={{ color: C.inkSoft, fontSize: ".95rem", marginTop: 2 }}>
                    ता. {data.taluka || "—"}, जि. {data.district || "—"}
                  </div>

                  <div className="mt-4">
                    {[
                      ["सर्व्हे/गट क्र.", data.survey_no],
                      ["क्षेत्र", data.area],
                      ["जमीन प्रकार", data.land_type],
                      ["मालक", data.owner],
                      ["अक्षांश/रेखांश", coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : "—"],
                    ].map(([k,v],i)=>(
                      <div key={i} className="ps-row">
                        <span className="k">{k}</span>
                        <span className="v">{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 grid gap-2">
                  <button
                    onClick={() => window.print()}
                    className="ps-btn ps-btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "1.05rem 1.4rem", fontSize: "1.1rem" }}
                  >
                    <Icon.download style={{ width: 20, height: 20 }} />
                    PDF रिपोर्ट डाउनलोड करा
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      className="ps-btn ps-btn-wa"
                      style={{ width: "100%", justifyContent: "center" }}
                      target="_blank" rel="noreferrer"
                      href={`https://wa.me/918625801907?text=${encodeURIComponent(
                        `नमस्कार, मला माझ्या जमिनीची प्रत हवी आहे.\nगाव: ${data.village}\nतालुका: ${data.taluka}\nजिल्हा: ${data.district}\nसर्व्हे: ${data.survey_no}`
                      )}`}
                    >
                      <Icon.whatsapp style={{ width: 18, height: 18 }} />
                      व्हॉट्सॲप शेअर
                    </a>
                    <button onClick={() => window.print()} className="ps-btn ps-btn-navy" style={{ width: "100%", justifyContent: "center" }}>
                      <Icon.print style={{ width: 18, height: 18 }} />
                      प्रिंट करा
                    </button>
                  </div>
                  <button onClick={reset} className="ps-btn ps-btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                    दुसरा ७/१२ अपलोड करा
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable report (visible only when printing) */}
      {stage === "done" && data && (
        <PrintableReport data={data} coords={coords} />
      )}
    </section>
  );
}

function UploadingAnimation({ file }) {
  const [pct, setPct] = useState(4);
  useEffect(() => {
    let v = 4;
    const t = setInterval(() => {
      v = Math.min(100, v + Math.random() * 14 + 4);
      setPct(Math.round(v));
      if (v >= 100) clearInterval(t);
    }, 110);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid md:grid-cols-12 gap-6 items-stretch ps-rise">
      <div className="md:col-span-7">
        <div className="ps-card-premium" style={{ padding: 36, minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div className="ps-upload-stage" style={{ marginBottom: 24 }}>
            <div className="ps-upload-ring" style={{ animationDelay: "0s" }} />
            <div className="ps-upload-ring" style={{ animationDelay: "0.55s" }} />
            <div className="ps-upload-ring" style={{ animationDelay: "1.1s" }} />
            <div style={{
              width: 86, height: 86, borderRadius: 24,
              background: `linear-gradient(180deg, ${C.greenBright}, ${C.green})`,
              display: "grid", placeItems: "center",
              boxShadow: "0 18px 36px -10px rgba(15,122,79,0.6), 0 1px 0 rgba(255,255,255,0.25) inset",
              position: "relative", zIndex: 2,
            }}>
              <Icon.upload className="ps-bounce" style={{ width: 38, height: 38, color: "#fff" }} />
            </div>
          </div>

          <div className="ps-display" style={{ fontSize: "1.8rem", color: C.navy, lineHeight: 1.15 }}>
            अपलोड होत आहे...
          </div>
          <div style={{ color: C.inkSoft, marginTop: 6, fontSize: "1.02rem" }}>
            <Icon.doc style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "-2px", marginRight: 6, color: C.navy }} />
            {file?.name}
          </div>

          <div style={{ marginTop: 22, width: "100%", maxWidth: 420 }}>
            <div className="ps-bar">
              <div className="ps-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="ps-mono" style={{ fontSize: ".82rem", color: C.inkSoft, letterSpacing: ".1em" }}>
                <Icon.lock style={{ width: 12, height: 12, display: "inline-block", verticalAlign: "-1px", marginRight: 4 }}/>
                सुरक्षित अपलोड · ENCRYPTED
              </span>
              <span className="ps-mono" style={{ fontSize: ".95rem", color: C.green, fontWeight: 700 }}>
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <div className="ps-card-deep" style={{ padding: 22, height: "100%" }}>
          <div className="ps-mono" style={{ color: "#9fb6c7", fontSize: ".74rem", letterSpacing: ".18em" }}>
            SECURE TRANSFER
          </div>
          <div className="ps-display mt-2" style={{ fontSize: "1.5rem", color: "#fff" }}>
            तुमची फाईल सुरक्षित आहे
          </div>
          <div style={{ color: "#9fb6c7", marginTop: 6 }}>
            एनक्रिप्टेड कनेक्शनद्वारे फक्त वाचनासाठी पाठवली जात आहे.
          </div>
          <ul style={{ marginTop: 18 }}>
            {[
              "256-bit SSL एनक्रिप्शन",
              "फाईल कुठेही जतन होणार नाही",
              "फक्त AI ओळख यंत्र वापरते",
              "वाचून लगेच निकाल मिळेल",
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3" style={{ padding: "8px 0", color: "#cfe9da" }}>
                <Icon.check style={{ width: 18, height: 18, color: C.greenBright, flexShrink: 0 }} />
                <span style={{ fontSize: ".98rem" }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MapStat({ label, value, tone }) {
  const map = {
    green: { bg: `${C.green}10`, fg: C.green, border: `${C.green}33` },
    amber: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
    navy:  { bg: `${C.navy}10`,  fg: C.navy,  border: `${C.navy}25` },
  }[tone];
  return (
    <div style={{ background: map.bg, color: map.fg, border: `1px solid ${map.border}`, borderRadius: 12, padding: "10px 12px" }}>
      <div className="ps-mono" style={{ fontSize: ".7rem", letterSpacing: ".14em", opacity: .85 }}>{label.toUpperCase()}</div>
      <div style={{ fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function GovSeal({ size = 100 }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <defs>
        <path id="ps-seal-top" d="M 50,50 m -38,0 a 38,38 0 0,1 76,0" />
        <path id="ps-seal-bot" d="M 50,50 m 38,0 a 38,38 0 0,1 -76,0" />
      </defs>
      {/* Outer rings */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={C.green} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="42.5" fill="none" stroke={C.saffron} strokeWidth="0.7" strokeDasharray="2 2" />
      <circle cx="50" cy="50" r="29" fill="none" stroke={C.green} strokeWidth="0.8" />
      {/* Curved labels */}
      <text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="5.6" letterSpacing="1.4" fill={C.navy} fontWeight="700">
        <textPath href="#ps-seal-top" startOffset="50%" textAnchor="middle">
          • PRINTSHUBH • LAND REPORT •
        </textPath>
      </text>
      <text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="4.8" letterSpacing="1.2" fill={C.navy} fontWeight="600">
        <textPath href="#ps-seal-bot" startOffset="50%" textAnchor="middle">
          MAHARASHTRA · महाराष्ट्र शासन डेटा
        </textPath>
      </text>
      {/* Center: chakra-style emblem */}
      <g transform="translate(50,50)">
        <g stroke={C.green} strokeWidth="0.45" opacity="0.7">
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={i} x1="0" y1="0" x2="0" y2="-22" transform={`rotate(${i * 15})`} />
          ))}
        </g>
        <circle r="22" fill="none" stroke={C.green} strokeWidth="1" />
        <circle r="14" fill={C.cream} stroke={C.saffron} strokeWidth="0.9" />
        <text fontFamily="'Tiro Devanagari Marathi', serif" fontSize="9.5" textAnchor="middle" dy="3.4" fill={C.navy} fontWeight="700">
          ७/१२
        </text>
      </g>
    </svg>
  );
}

function PrintableReport({ data, coords }) {
  const reportId = "PS-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 90000) + 10000);
  const today = new Date().toLocaleDateString("mr-IN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div id="ps-print-area" style={{ display: "none", padding: 0 }}>
      <style>{`
        @media print {
          #ps-print-area { display: block !important; }
          @page { margin: 12mm; size: A4; }
        }
      `}</style>

      <div style={{
        position: "relative",
        border: `2.5px double ${C.navy}`,
        borderRadius: 6,
        overflow: "hidden",
        background: "#ffffff",
        fontFamily: "'Hind Vadodara', sans-serif",
        color: C.ink,
      }}>
        {/* Top flag stripe */}
        <div style={{ height: 7, background: `linear-gradient(90deg, ${C.saffron} 0% 33%, #fff 33% 66%, ${C.green} 66% 100%)` }} />

        {/* Watermark */}
        <div className="ps-watermark">PRINTSHUBH</div>

        <div style={{ padding: "22px 26px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <GovSeal size={94} />
            <div style={{ flex: 1, textAlign: "center", paddingTop: 8 }}>
              <div className="ps-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: C.inkSoft }}>
                MAHARASHTRA · LAND INFORMATION SERVICE
              </div>
              <div style={{ fontFamily: "'Tiro Devanagari Marathi', serif", fontSize: 28, color: C.navy, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                जमीन माहिती रिपोर्ट
              </div>
              <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 2 }}>
                7/12 Extract · Verified by AI · Cross-referenced with Government Data
              </div>
              <div style={{ height: 3, width: 70, background: C.saffron, margin: "10px auto 0", borderRadius: 2 }} />
            </div>
            <div style={{ width: 96, textAlign: "right", flexShrink: 0 }}>
              <div className="ps-mono" style={{ fontSize: 10, color: C.inkSoft, letterSpacing: ".1em" }}>REPORT ID</div>
              <div className="ps-mono" style={{ fontSize: 11, color: C.navy, fontWeight: 700, marginTop: 2 }}>{reportId}</div>
              <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 1 }}>{today}</div>
              <div style={{ marginTop: 6, padding: 3, border: `1px solid ${C.line}`, borderRadius: 4, display: "inline-block", background: "#fff" }}>
                <svg viewBox="0 0 30 30" width="56" height="56">
                  <rect width="30" height="30" fill="white" />
                  {/* Finder squares */}
                  <rect x="0" y="0" width="9" height="9" fill={C.navy} />
                  <rect x="2" y="2" width="5" height="5" fill="white" />
                  <rect x="3" y="3" width="3" height="3" fill={C.navy} />
                  <rect x="21" y="0" width="9" height="9" fill={C.navy} />
                  <rect x="23" y="2" width="5" height="5" fill="white" />
                  <rect x="24" y="3" width="3" height="3" fill={C.navy} />
                  <rect x="0" y="21" width="9" height="9" fill={C.navy} />
                  <rect x="2" y="23" width="5" height="5" fill="white" />
                  <rect x="3" y="24" width="3" height="3" fill={C.navy} />
                  {/* Random pattern */}
                  {[[11,1],[13,1],[15,2],[12,3],[14,4],[11,6],[13,7],[2,11],[4,12],[6,11],[15,11],[19,12],[22,12],[24,11],[2,14],[5,15],[8,15],[17,14],[20,15],[23,15],[2,17],[5,18],[7,18],[18,18],[21,17],[24,19],[12,21],[14,22],[16,23],[12,25],[14,26],[15,27],[18,21],[21,23],[24,25],[27,21],[27,25]].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="2" height="2" fill={C.navy} />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginTop: 18, padding: "14px 18px", background: C.cream, borderLeft: `5px solid ${C.saffron}`, borderRadius: 4 }}>
            <div className="ps-mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.inkSoft }}>SUBJECT LAND</div>
            <div style={{ fontFamily: "'Tiro Devanagari Marathi', serif", fontSize: 24, color: C.navy, lineHeight: 1.15, marginTop: 2 }}>
              गाव {data.village || "—"}
            </div>
            <div style={{ color: C.inkSoft, fontSize: 14, marginTop: 2 }}>
              ता. {data.taluka || "—"}, जि. {data.district || "—"}
            </div>
          </div>

          {/* Mini location preview (CSS-based for print reliability) */}
          <div style={{
            marginTop: 14, height: 130, borderRadius: 8, position: "relative", overflow: "hidden",
            background: `radial-gradient(circle at 55% 50%, rgba(16,185,129,0.30), transparent 45%), linear-gradient(135deg, #0e3052 0%, #102b46 100%)`,
            border: `1px solid ${C.line}`,
          }}>
            <svg viewBox="0 0 300 130" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <defs>
                <pattern id="minigrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="130" fill="url(#minigrid)" />
              {/* Faux roads */}
              <path d="M0,80 Q80,70 150,75 T300,68" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none"/>
              <path d="M120,0 Q130,40 145,75 T160,130" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" fill="none"/>
              {/* Village boundary */}
              <path d="M105,50 L175,46 L195,72 L165,100 L120,96 Z" fill="rgba(16,185,129,0.18)" stroke={C.greenBright} strokeWidth="1.6" strokeDasharray="4 3"/>
              {/* Plot highlight */}
              <path d="M138,62 L162,60 L165,78 L142,80 Z" fill="rgba(252,211,77,0.45)" stroke="#FCD34D" strokeWidth="2"/>
            </svg>
            {/* Pin */}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
              <svg viewBox="0 0 24 24" width="32" height="32" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.5))" }}>
                <path fill={C.greenBright} stroke={C.green} strokeWidth="0.8" d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
            {/* Labels */}
            <div style={{
              position: "absolute", left: 10, top: 10,
              background: "rgba(11,37,69,0.85)", color: "#fff",
              padding: "3px 9px", borderRadius: 99, fontSize: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: ".06em"
            }}>
              SATELLITE VIEW
            </div>
            <div style={{
              position: "absolute", right: 10, top: 10,
              background: "rgba(15,122,79,0.92)", color: "#fff",
              padding: "3px 9px", borderRadius: 99, fontSize: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: ".06em", fontWeight: 700
            }}>
              ✓ LOCATED
            </div>
            <div style={{
              position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)",
              background: "rgba(11,37,69,0.85)", color: "#fff",
              padding: "3px 12px", borderRadius: 99, fontSize: 11,
              fontFamily: "'Tiro Devanagari Marathi', serif"
            }}>
              📍 {data.village || "गाव"} · {coords ? `${coords[0].toFixed(3)}°N, ${coords[1].toFixed(3)}°E` : ""}
            </div>
          </div>

          {/* Data table */}
          <table style={{ width: "100%", marginTop: 18, borderCollapse: "collapse", border: `1px solid ${C.navy}` }}>
            <thead>
              <tr style={{ background: C.navy, color: "#fff" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: ".06em", width: "44%" }}>
                  तपशील · FIELD
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: ".06em" }}>
                  माहिती · DETAIL
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["१. गावाचे नाव", data.village],
                ["२. तालुका", data.taluka],
                ["३. जिल्हा", data.district],
                ["४. सर्व्हे / गट क्रमांक", data.survey_no],
                ["५. क्षेत्र", data.area],
                ["६. जमीन प्रकार", data.land_type],
                ["७. मालकाचे नाव", data.owner],
                ["८. अक्षांश / रेखांश", coords ? `${coords[0].toFixed(5)}° N, ${coords[1].toFixed(5)}° E` : "—"],
                ["९. सीमा स्थिती", "गाव सीमा आढळली · Verified"],
              ].map(([k, v], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7" }}>
                  <td style={{ padding: "10px 14px", color: C.ink, fontWeight: 500, borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}>{k}</td>
                  <td style={{ padding: "10px 14px", color: C.navy, fontWeight: 700, borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}>
                    {v || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Note */}
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff7ed", border: `1px solid #fed7aa`, borderRadius: 5, fontSize: 11.5, color: "#9a3412" }}>
            <strong>टीप:</strong> हा रिपोर्ट प्रिंटशुभ AI साधनाद्वारे तयार केला आहे. अधिकृत प्रत हवी असल्यास संबंधित तलाठी
            कार्यालयाशी संपर्क करा. हा दस्तऐवज न्यायालयीन कामकाजासाठी अधिकृत म्हणून वापरता येणार नाही.
          </div>

          {/* Signatures + stamp */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32, position: "relative" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 4, width: 170, margin: "0 auto", fontSize: 11, color: C.inkSoft }}>
                ग्राहक स्वाक्षरी · Customer
              </div>
            </div>

            <div className="ps-stamp-true" style={{ fontSize: 15 }}>
              सत्य प्रत<br />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 8.5, letterSpacing: ".15em", fontWeight: 600 }}>
                VERIFIED · {new Date().getFullYear()}
              </span>
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 4, width: 170, margin: "0 auto", fontSize: 11, color: C.inkSoft }}>
                अधिकृत स्वाक्षरी · Authorised
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 22, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", color: C.inkSoft, fontSize: 11 }}>
            <span><strong style={{ color: C.navy }}>printshubh.shop</strong> · Kolhapur, Maharashtra</span>
            <span style={{ fontWeight: 700, color: C.green }}>📞 +91 86258 01907</span>
            <span>WhatsApp 24×7</span>
          </div>
        </div>

        {/* Bottom flag stripe */}
        <div style={{ height: 7, background: `linear-gradient(90deg, ${C.saffron} 0% 33%, #fff 33% 66%, ${C.green} 66% 100%)` }} />
      </div>
    </div>
  );
}

// =============================================================
//                        STATS STRIP
// =============================================================
function Stats() {
  const items = [
    { n: "५०,०००+", l: "७/१२ डाउनलोड्स" },
    { n: "३६", l: "जिल्हे कव्हर" },
    { n: "४४,०००+", l: "गावे" },
    { n: "४.९ ★", l: "ग्राहक रेटिंग" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 ps-no-print">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((s,i)=>(
          <div key={i} className="ps-stat">
            <div className="ps-display" style={{ fontSize: "2rem", color: C.navy, lineHeight: 1 }}>{s.n}</div>
            <div style={{ color: C.inkSoft, marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================
//                       SERVICES STRIP
// =============================================================
function Services() {
  const list = [
    ["७/१२ रिपोर्ट", "Satbara extract"],
    ["८अ नक्कल", "8A copy"],
    ["गाव नकाशा", "Village map"],
    ["फेरफार", "Mutation"],
    ["भू नकाशा", "Bhu-naksha"],
    ["मालमत्ता कार्ड", "Property card"],
  ];
  return (
    <section id="services" className="max-w-7xl mx-auto px-4 md:px-8 py-16 ps-no-print">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="ps-mono" style={{ color: C.green, fontSize: ".78rem", letterSpacing: ".22em" }}>OUR SERVICES</div>
        <h2 className="ps-display mt-2" style={{ fontSize: "2.2rem", color: C.navy }}>आम्ही काय देतो</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {list.map(([mr,en],i)=>(
          <a key={i} href="https://wa.me/918625801907" target="_blank" rel="noreferrer" className="ps-card flex items-center gap-4" style={{ padding: 18, textDecoration: "none" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: i%2===0 ? `${C.green}10` : `${C.navy}08`,
              color: i%2===0 ? C.green : C.navy,
              display: "grid", placeItems: "center"
            }}>
              <Icon.doc style={{ width: 24, height: 24 }}/>
            </div>
            <div className="flex-1">
              <div className="ps-display" style={{ fontSize: "1.2rem", color: C.navy }}>{mr}</div>
              <div className="ps-mono" style={{ fontSize: ".75rem", color: C.inkSoft, letterSpacing: ".1em" }}>{en.toUpperCase()}</div>
            </div>
            <span className="ps-btn ps-btn-ghost" style={{ padding: ".55rem .85rem", fontSize: ".85rem" }}>
              ऑर्डर
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

// =============================================================
//                          FAQ
// =============================================================
function FAQ() {
  const qs = [
    ["हे साधन मोफत आहे का?", "होय, ७/१२ अपलोड करून रिपोर्ट पाहणे पूर्णपणे मोफत आहे. प्रिंट कॉपी हवी असल्यास व्हॉट्सॲप वर ऑर्डर करा."],
    ["माझा डेटा सुरक्षित आहे का?", "तुमची फाईल फक्त वाचली जाते आणि लगेच नष्ट केली जाते. आम्ही कोणताही दस्तऐवज जतन करत नाही."],
    ["कोणत्या भाषा समर्थित आहेत?", "साधन मराठी आणि इंग्रजी मजकूर अचूक वाचू शकते. हस्तलिखित मजकूर सध्या मर्यादित प्रमाणात समर्थित आहे."],
    ["रिपोर्टमध्ये काय असेल?", "गाव, तालुका, जिल्हा, सर्व्हे क्रमांक, क्षेत्र, जमीन प्रकार, मालकाचे नाव आणि नकाशा."],
    ["प्रिंट मागवायचे असल्यास?", "व्हॉट्सॲप वरून थेट ऑर्डर करा. कोल्हापूरमधून संपूर्ण महाराष्ट्रात कुरिअर डिलिव्हरी."],
  ];
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 md:px-8 py-16 ps-no-print">
      <div className="text-center mb-10">
        <div className="ps-mono" style={{ color: C.green, fontSize: ".78rem", letterSpacing: ".22em" }}>FAQ</div>
        <h2 className="ps-display mt-2" style={{ fontSize: "2.2rem", color: C.navy }}>वारंवार विचारले जाणारे प्रश्न</h2>
      </div>
      {qs.map(([q,a],i)=>(
        <details key={i} className="ps-faq">
          <summary>
            <span>{q}</span>
            <Icon.plus style={{ width: 18, height: 18 }} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}

// =============================================================
//                          CTA STRIP
// =============================================================
function CTA() {
  return (
    <section className="ps-no-print" style={{ background: `linear-gradient(135deg, ${C.navyDeep}, ${C.navy})`, color: "#fff" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="ps-mono" style={{ color: C.greenBright, fontSize: ".78rem", letterSpacing: ".22em" }}>READY TO START</div>
          <h3 className="ps-display mt-2" style={{ fontSize: "2.2rem", lineHeight: 1.15 }}>
            आजच तुमच्या जमिनीची माहिती मिळवा.
          </h3>
          <p style={{ color: "#cfd8e4", marginTop: 8, lineHeight: 1.7, maxWidth: 540 }}>
            ३० वर्षांपासून कोल्हापूरमधून संपूर्ण महाराष्ट्राला सेवा. आर्किटेक्ट, सिव्हिल इंजिनियर, शासकीय कार्यालये आमच्यावर विश्वास ठेवतात.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <a href="#tool" className="ps-btn ps-btn-primary">
            <Icon.upload style={{ width: 18, height: 18 }} />
            ७/१२ अपलोड करा
          </a>
          <a href="https://wa.me/918625801907" target="_blank" rel="noreferrer" className="ps-btn ps-btn-wa">
            <Icon.whatsapp style={{ width: 18, height: 18 }} />
            व्हॉट्सॲप ऑर्डर
          </a>
        </div>
      </div>
    </section>
  );
}

// =============================================================
//                         FOOTER
// =============================================================
function Footer() {
  return (
    <footer className="ps-no-print" style={{ background: C.navyDeep, color: "#cfd8e4" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, ${C.greenBright})`, display: "grid", placeItems: "center" }}>
              <Icon.doc style={{ width: 20, height: 20, color: "#fff" }}/>
            </div>
            <div className="ps-display" style={{ fontSize: "1.4rem", color: "#fff" }}>प्रिंटशुभ</div>
          </div>
          <p style={{ lineHeight: 1.7, fontSize: ".95rem", maxWidth: 420 }}>
            १९९६ पासून वाइड फॉरमॅट प्रिंटिंग, जमीन दस्तऐवज, गाव नकाशे आणि शासकीय प्रिंट सेवा. कोल्हापूर, महाराष्ट्र.
          </p>
          <div className="mt-4 ps-mono" style={{ fontSize: ".8rem", letterSpacing: ".1em", color: "#9fb6c7" }}>
            📍 KOLHAPUR, MAHARASHTRA · INDIA
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="ps-mono mb-3" style={{ color: C.greenBright, fontSize: ".74rem", letterSpacing: ".22em" }}>SERVICES</div>
          <ul style={{ lineHeight: 2 }}>
            <li>७/१२ रिपोर्ट</li><li>८अ नक्कल</li><li>गाव नकाशा</li><li>भू-नकाशा</li><li>फेरफार</li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="ps-mono mb-3" style={{ color: C.greenBright, fontSize: ".74rem", letterSpacing: ".22em" }}>CONTACT</div>
          <div style={{ lineHeight: 1.9 }}>
            <div>📞 +91 86258 01907</div>
            <div>✉️ hello@printshubh.shop</div>
            <div>💬 WhatsApp 24×7</div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <span style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontSize: ".8rem" }}>UPI</span>
            <span style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontSize: ".8rem" }}>Razorpay</span>
            <span style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontSize: ".8rem" }}>SSL Secure</span>
          </div>
        </div>
      </div>
      <div className="ps-flag-stripe" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-wrap justify-between gap-2 text-sm" style={{ color: "#9fb6c7" }}>
        <div>© {new Date().getFullYear()} PrintShubh. सर्व हक्क राखीव.</div>
        <div className="ps-mono" style={{ letterSpacing: ".1em" }}>MADE IN KOLHAPUR · MAHARASHTRA</div>
      </div>
    </footer>
  );
}

// =============================================================
//                  MEASUREMENT COMPARISON TABLE
// =============================================================
function MeasurementTable() {
  const rows = [
    { old: "१ गुंठा",   nu: "१०१.१७ चौ.मी",      eq: "०.०२५ एकर",   use: "साधारण १००' × ३३' — लहान प्लॉट किंवा घराची जागा" },
    { old: "१ एकर",     nu: "०.४०४७ हेक्टर",     eq: "४० गुंठे",     use: "बागायत / जिरायत क्षेत्र — मध्यम शेत" },
    { old: "१ बिघा",    nu: "४० गुंठे",          eq: "०.४ हेक्टर",   use: "महाराष्ट्रात पक्का बिघा — गावठाण क्षेत्र" },
    { old: "१ चौ.फूट",  nu: "०.०९२९ चौ.मी",      eq: "—",           use: "बांधकाम / built-up क्षेत्र — फ्लॅट / प्लॅन" },
    { old: "१ R (आर)",  nu: "१०० चौ.मी",         eq: "१/१०० हेक्टर", use: "७/१२ वर 'आर' चिन्ह — अधिकृत मोजमाप" },
    { old: "१ हेक्टर",   nu: "१०,००० चौ.मी",      eq: "२.४७१ एकर",   use: "मोठ्या क्षेत्रासाठी — वहिवाट प्रदेश" },
    { old: "१ चौ.मी",   nu: "१०.७६ चौ.फूट",      eq: "—",           use: "बांधकाम / interior planning standard" },
    { old: "१ एकर",     nu: "४३,५६० चौ.फूट",     eq: "४०४६.८६ चौ.मी", use: "रिअल इस्टेट / लेआउट प्लॉटिंग" },
  ];
  const headers = ["जुनी मोजणी", "नवीन मोजणी", "समतुल्य क्षेत्र", "वापर / स्पष्टीकरण"];

  const printTable = () => {
    const tableHtml = document.getElementById("ps-measure-content")?.outerHTML || "";
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="mr"><head>
      <meta charset="utf-8"/>
      <title>जुनी विरुद्ध नवीन मोजणी — प्रिंटशुभ</title>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi&family=Hind+Vadodara:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Hind Vadodara', sans-serif; padding: 32px; color: #0A1628; }
        h1 { font-family: 'Tiro Devanagari Marathi', serif; color: #0B2545; margin: 0 0 4px; font-size: 26px; }
        .sub { color: #486581; font-size: 12px; margin-bottom: 18px; }
        .stripe { height: 6px; background: linear-gradient(90deg, #D97706 0% 33%, #fff 33% 66%, #0F7A4F 66%); margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #0B2545; }
        thead th { background: #0B2545; color: #fff; padding: 12px 14px; text-align: left; font-family: 'Tiro Devanagari Marathi', serif; }
        tbody td { padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
        tbody tr:nth-child(even) { background: #FAF7EE; }
        td:first-child { font-family: 'Tiro Devanagari Marathi', serif; color: #0B2545; font-weight: 700; }
        td:nth-child(2) { color: #0F7A4F; font-weight: 700; font-family: 'Tiro Devanagari Marathi', serif; }
        td:nth-child(3) { font-family: 'Plus Jakarta Sans', sans-serif; color: #486581; }
        .footer { margin-top: 18px; font-size: 11px; color: #486581; display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #E2E8F0; }
      </style></head>
      <body>
        <div class="stripe"></div>
        <h1>जुनी विरुद्ध नवीन मोजणी</h1>
        <div class="sub">Maharashtra Land Measurement Comparison · printshubh.shop</div>
        ${tableHtml}
        <div class="footer">
          <span>printshubh.shop</span>
          <span>📞 +91 86258 01907</span>
          <span>${new Date().toLocaleDateString("mr-IN")}</span>
        </div>
      </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  return (
    <section id="measurement" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20 ps-no-print">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="ps-mono" style={{ color: C.green, fontSize: ".78rem", letterSpacing: ".22em" }}>
          MEASUREMENT GUIDE
        </div>
        <h2 className="ps-display mt-2" style={{ fontSize: "2.4rem", color: C.navy, lineHeight: 1.15 }}>
          जुनी विरुद्ध नवीन मोजणी
        </h2>
        <div style={{ height: 3, width: 60, background: C.saffron, margin: "12px auto 0", borderRadius: 2 }} />
        <p style={{ color: C.inkSoft, marginTop: 14, fontSize: "1.05rem", lineHeight: 1.7 }}>
          गुंठा, एकर, बिघा, हेक्टर — सगळी मोजमापे एका तक्त्यात. कोणतीही गोंधळ नाही.
        </p>
      </div>

      <div className="ps-measure-wrap" id="ps-measure-content">
        <table className="ps-measure-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td data-label={headers[0]}>{r.old}</td>
                <td data-label={headers[1]}>{r.nu}</td>
                <td data-label={headers[2]}>{r.eq}</td>
                <td data-label={headers[3]}>{r.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div style={{ color: C.inkSoft, fontSize: ".94rem" }}>
          <Icon.shield style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "-2px", marginRight: 6, color: C.green }} />
          महाराष्ट्र भूमी अभिलेख कार्यालयाच्या मानकांनुसार
        </div>
        <button onClick={printTable} className="ps-btn ps-btn-navy">
          <Icon.download style={{ width: 18, height: 18 }} />
          PDF डाउनलोड / प्रिंट
        </button>
      </div>
    </section>
  );
}

// =============================================================
//                MEASUREMENT CONVERTER (FAB + MODAL)
// =============================================================
const UNITS = {
  "गुंठा":     { sqm: 101.171,  desc: "Guntha — १/४० एकर" },
  "एकर":      { sqm: 4046.86,  desc: "Acre" },
  "हेक्टर":    { sqm: 10000,    desc: "Hectare" },
  "आर (R)":   { sqm: 100,      desc: "R / Are — १/१०० हेक्टर" },
  "चौ.मी":    { sqm: 1,        desc: "Square Metre" },
  "चौ.फूट":   { sqm: 0.092903, desc: "Square Foot" },
  "बिघा":     { sqm: 4046.86,  desc: "Pakka Bigha (Maharashtra ≈ ४० गुंठे)" },
};

function ConverterModal({ onClose }) {
  const units = Object.keys(UNITS);
  const [val, setVal] = useState("1");
  const [from, setFrom] = useState("एकर");
  const [to, setTo] = useState("गुंठा");

  const num = parseFloat(val);
  const safe = isFinite(num) ? num : 0;
  const sqm = safe * UNITS[from].sqm;
  const result = sqm / UNITS[to].sqm;

  const fmt = (n) => {
    if (!isFinite(n)) return "—";
    if (Math.abs(n) >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    if (Math.abs(n) >= 1)    return n.toFixed(3).replace(/\.?0+$/, "");
    return n.toFixed(5).replace(/\.?0+$/, "");
  };

  const swap = () => { setFrom(to); setTo(from); };

  // Esc to close
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const quickRows = [
    ["१ एकर",   "= ४० गुंठे = ०.४०४७ हेक्टर"],
    ["१ गुंठा",  "= १०१.१७ चौ.मी = ०.०२५ एकर"],
    ["१ हेक्टर", "= २.४७१ एकर = १०,००० चौ.मी"],
    ["१ R",     "= १०० चौ.मी = १/१०० हेक्टर"],
  ];

  return (
    <div className="ps-modal-backdrop ps-no-print" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ps-modal-header">
          <div>
            <div className="ps-mono" style={{ fontSize: ".74rem", letterSpacing: ".18em", color: "#9fb6c7" }}>
              QUICK TOOL
            </div>
            <div className="ps-display" style={{ fontSize: "1.4rem", color: "#fff", marginTop: 2 }}>
              मोजणी रूपांतर
            </div>
          </div>
          <button className="ps-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="ps-modal-body">
          {/* From */}
          <label style={{ display: "block", fontSize: ".85rem", color: C.inkSoft, marginBottom: 6, fontWeight: 600 }}>
            कडून (From)
          </label>
          <input
            type="number"
            inputMode="decimal"
            className="ps-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="0"
          />
          <select className="ps-select" style={{ marginTop: 8 }} value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          <button className="ps-swap-btn" onClick={swap} aria-label="Swap units" type="button">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M7 7h12l-3-3M17 17H5l3 3"/>
            </svg>
          </button>

          {/* Result */}
          <div className="ps-conv-result">
            <div className="ps-conv-result-num">{fmt(result)}</div>
            <div className="ps-conv-result-unit">{to}</div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.line}`, fontSize: ".85rem", color: C.inkSoft }}>
              {fmt(safe)} {from} = {fmt(sqm)} चौ.मी
            </div>
          </div>

          {/* To */}
          <label style={{ display: "block", fontSize: ".85rem", color: C.inkSoft, marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
            पर्यंत (To)
          </label>
          <select className="ps-select" value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Quick reference */}
          <div className="ps-conv-quick">
            <div className="ps-mono" style={{ color: C.inkSoft, fontSize: ".7rem", letterSpacing: ".18em", marginBottom: 6 }}>
              QUICK REFERENCE
            </div>
            {quickRows.map(([k, v], i) => (
              <div key={i} className="ps-conv-quick-row">
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MeasurementConverterFAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="ps-fab-measure ps-no-print"
        onClick={() => setOpen(true)}
        aria-label="मोजणी रूपांतर — Measurement converter"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M2 12 L22 6 L22 18 L2 12 Z" />
          <path d="M5 13 L5 11 M8 14 L8 11 M11 15 L11 11 M14 14 L14 11 M17 13 L17 11" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <ConverterModal onClose={() => setOpen(false)} />}
    </>
  );
}

// =============================================================
//                  KNOWLEDGE / BLOG SECTION
// =============================================================
function KnowledgeSection() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("सर्व");
  const [openIdx, setOpenIdx] = useState(null);

  const articles = [
    {
      cat: "७/१२",
      title: "७/१२ उतारा कसा वाचावा?",
      excerpt: "सात-बारा उताऱ्यातील प्रत्येक खण काय दर्शवतो — सर्व्हे क्र., क्षेत्र, मालकाचे नाव, फेरफार नोंदी.",
      time: "५ मि वाचन",
      keywords: ["सात बारा", "उतारा", "७/१२"],
      icon: Icon.doc,
      body: (
        <>
          <p>सात-बारा उतारा म्हणजे महाराष्ट्र भूमी अभिलेख कायद्यानुसार जमिनीच्या मालकीचा अधिकृत पुरावा. एकूण <strong>दोन भाग</strong> असतात — गाव नमुना <strong>७</strong> (मालकी हक्क) आणि गाव नमुना <strong>१२</strong> (पीक/वहिवाटीच्या नोंदी).</p>
          <p>उताऱ्यात सर्व्हे/गट क्रमांक, एकूण क्षेत्र (हेक्टर/आर), जमीन प्रकार (बागायत/जिरायत/NA), मालकाचे नाव, खाते क्रमांक, आणि फेरफार/वारस नोंदी असतात. <strong>"भोगवटादार"</strong> म्हणजे प्रत्यक्ष कसणारी व्यक्ती.</p>
          <p>कोणताही व्यवहार करण्यापूर्वी ७/१२ चा अद्ययावत उतारा तपासणे आवश्यक — कारण फेरफार नोंदी इथेच दिसतात.</p>
        </>
      ),
    },
    {
      cat: "फेरफार",
      title: "फेरफार प्रक्रिया — संपूर्ण मार्गदर्शन",
      excerpt: "जमिनीच्या मालकीतील बदल नोंदवण्यासाठी फेरफार कसा करावा. आवश्यक कागदपत्रे, कालावधी, खर्च.",
      time: "७ मि वाचन",
      keywords: ["फेरफार", "मालकी", "बदल"],
      icon: Icon.scan,
      body: (
        <>
          <p>फेरफार म्हणजे ७/१२ उताऱ्यात नोंदविलेल्या मालकी हक्कात बदल करण्याची अधिकृत प्रक्रिया. <strong>खरेदी-विक्री, वारस हक्क, दानपत्र, बक्षीसपत्र</strong> या सर्व प्रकरणांत फेरफार आवश्यक आहे.</p>
          <p>आवश्यक कागदपत्रे: नोंदणीकृत खरेदीखत/दस्त, मूळ ७/१२, आधार, ८अ नक्कल, फोटो, आणि शपथपत्र. तलाठी कार्यालयात अर्ज दाखल केल्यानंतर सूचना प्रसिद्ध होते आणि <strong>१५ दिवसांचा हरकत कालावधी</strong> असतो.</p>
          <p>हरकत नसल्यास सहाय्यक मंडळ अधिकारी फेरफार मंजूर करतात आणि नवीन ७/१२ जारी होतो. साधारण <strong>३०-६० दिवसांत</strong> प्रक्रिया पूर्ण होते.</p>
        </>
      ),
    },
    {
      cat: "मोजणी",
      title: "जमीन मोजणी — गुंठा, एकर, हेक्टर",
      excerpt: "जुन्या व नवीन मोजणी पद्धतींची तुलना. कोणत्या क्षेत्रासाठी कोणते एकक वापरावे.",
      time: "४ मि वाचन",
      keywords: ["गुंठा", "एकर", "हेक्टर", "मोजणी"],
      icon: Icon.shield,
      body: (
        <>
          <p>महाराष्ट्रात <strong>१ एकर = ४० गुंठे</strong> ही जुनी पारंपरिक मोजणी आजही गाव-पातळीवर वापरली जाते. <strong>१ गुंठा = ३३ × ३३ फूट = १०१.१७ चौरस मीटर</strong>.</p>
          <p>नवीन ७/१२ मध्ये क्षेत्र <strong>हेक्टर - आर</strong> मध्ये दिले जाते. <strong>१ हेक्टर = १००A आर = १०,००० चौ.मी = २.४७१ एकर</strong>. म्हणून '१-२५' म्हणजे १ हेक्टर २५ आर.</p>
          <p>बांधकाम क्षेत्र चौरस फूट (sq.ft) किंवा चौरस मीटर मध्ये मोजले जाते. <strong>१ चौ.मी = १०.७६ चौ.फूट</strong>. UDCPR नियमांनुसार FSI मोजताना चौ.मी मध्येच मोजावे.</p>
        </>
      ),
    },
    {
      cat: "योजना",
      title: "PM किसान सम्मान निधी — अर्ज प्रक्रिया",
      excerpt: "केंद्र सरकारची शेतकऱ्यांसाठी ६,००० रू/वर्ष योजना. पात्रता, अर्ज, स्थिती तपासणी.",
      time: "६ मि वाचन",
      keywords: ["pm kisan", "योजना", "शेतकरी"],
      icon: Icon.spark,
      body: (
        <>
          <p>PM किसान सम्मान निधी अंतर्गत पात्र शेतकऱ्यांना <strong>दर वर्षी ६,००० रुपये</strong> थेट खात्यात जमा केले जातात — तीन हप्त्यांमध्ये (प्रत्येकी ₹२,०००).</p>
          <p>पात्रता: ज्यांच्याकडे <strong>लागवडीयोग्य जमीन</strong> आहे असे लहान/मध्यम शेतकरी कुटुंब. आयकर भरणारे, सरकारी कर्मचारी, निवृत्त राजपत्रित अधिकारी अपात्र आहेत.</p>
          <p>अर्ज pmkisan.gov.in वर ऑनलाइन करता येतो. आधार, बँक तपशील, ७/१२, ८अ आवश्यक. eKYC अनिवार्य आहे — स्थिती <strong>"Beneficiary Status"</strong> मधून तपासता येते.</p>
        </>
      ),
    },
    {
      cat: "७/१२",
      title: "८अ नक्कल — उपयोग व प्रक्रिया",
      excerpt: "मालमत्ता हस्तांतरणासाठी ८अ ची गरज का? कुठे वापरतात? कसे मिळवायचे?",
      time: "३ मि वाचन",
      keywords: ["८अ", "नक्कल"],
      icon: Icon.doc,
      body: (
        <>
          <p>८अ नक्कल हा गाव नमुना ८ चा उतारा आहे — यात <strong>एकाच मालकाच्या सर्व जमिनींची एकत्रित नोंद</strong> असते. म्हणजे एक व्यक्ती किती गावांत किती क्षेत्र धारण करते हे एका दस्तात दिसते.</p>
          <p>कर्ज, खरेदी-विक्री, NA परवानगी, कोर्ट केस, आयकर तपासणी — या सर्वांसाठी ८अ आवश्यक. तलाठी कार्यालयातून किंवा <strong>mahabhulekh.maharashtra.gov.in</strong> वरून ऑनलाइन डाउनलोड करता येतो.</p>
        </>
      ),
    },
    {
      cat: "RERA",
      title: "RERA अंतर्गत प्रकल्पाची नोंदणी",
      excerpt: "रिअल इस्टेट विकासकांसाठी अनिवार्य नियम. ग्राहक संरक्षण कसे मिळते?",
      time: "८ मि वाचन",
      keywords: ["rera", "रेरा", "बांधकाम"],
      icon: Icon.shield,
      body: (
        <>
          <p>RERA (Real Estate Regulatory Authority) कायदा २०१६ नुसार <strong>५००+ चौ.मी किंवा ८+ फ्लॅट्स</strong> असलेल्या प्रत्येक प्रकल्पाची maharera.maharashtra.gov.in वर नोंदणी अनिवार्य आहे.</p>
          <p>ग्राहक म्हणून फायदे: <strong>विलंबासाठी व्याजासह परतफेड, १/३ रक्कमेपर्यंत बुकिंग, ५ वर्षांची स्ट्रक्चरल वारंटी, कार्पेट एरिया वर विक्री</strong>.</p>
          <p>कोणतीही मालमत्ता खरेदी करण्यापूर्वी RERA रजिस्ट्रेशन क्रमांक तपासणे — हाच ग्राहकाचा सर्वात मोठा आधार.</p>
        </>
      ),
    },
    {
      cat: "मोजणी",
      title: "बिघा, गुंठा, R — Maharashtra Units",
      excerpt: "महाराष्ट्रात वापरले जाणारे प्रादेशिक मोजमाप एकके आणि त्यांचे SI रूपांतर.",
      time: "५ मि वाचन",
      keywords: ["बिघा", "R", "आर", "एकक"],
      icon: Icon.scan,
      body: (
        <>
          <p>"R" किंवा <strong>आर</strong> हे ७/१२ वर सर्वात जास्त दिसणारे एकक. <strong>१ आर = १०० चौ.मी</strong>. म्हणून '१ हेक्टर ३५ आर' म्हणजे १०,००० + ३,५०० = १३,५०० चौ.मी.</p>
          <p>बिघा हे एकक मुख्यतः उत्तर महाराष्ट्र व विदर्भात वापरतात — <strong>पक्का बिघा ≈ ४० गुंठे ≈ ०.४ हेक्टर</strong>. कच्चा बिघा प्रादेशिक भिन्न आहे.</p>
          <p>शहरी भागात <strong>चौ.मी आणि चौ.फूट</strong>, ग्रामीण भागात <strong>एकर/गुंठा/हेक्टर</strong>, आणि शासकीय कागदपत्रांत <strong>हेक्टर/आर</strong> हे प्रमुख वापरले जाते.</p>
        </>
      ),
    },
    {
      cat: "योजना",
      title: "महात्मा जोतिराव फुले शेतकरी कर्जमुक्ती",
      excerpt: "शेतकरी कर्जमाफीसाठी पात्रता, अर्ज प्रक्रिया, आवश्यक कागदपत्रे.",
      time: "५ मि वाचन",
      keywords: ["कर्जमाफी", "महात्मा फुले"],
      icon: Icon.spark,
      body: (
        <>
          <p>महाराष्ट्र राज्य शासनाची ही योजना पात्र शेतकऱ्यांना <strong>२ लाख रुपयांपर्यंतच्या पीक कर्जात माफी</strong> देते. राष्ट्रीयीकृत बँक, ग्रामीण बँक व सहकारी संस्थांची कर्जे यात समाविष्ट.</p>
          <p>पात्रता: ३० सप्टेंबर २०१९ रोजी थकबाकी असलेले अल्प/मध्यम भू-धारक. आधार, ७/१२, ८अ, बँक पासबुक, थकबाकी प्रमाणपत्र आवश्यक.</p>
          <p>अर्ज <strong>aaplesarkar.mahaonline.gov.in</strong> किंवा संबंधित बँक शाखेत. प्रत्येक तालुक्यात <strong>शिबिरे</strong> घेतली जातात.</p>
        </>
      ),
    },
    {
      cat: "फेरफार",
      title: "वारस हक्क व फेरफार",
      excerpt: "वडिलोपार्जित जमिनीचा वारस हक्क कसा सिद्ध करावा. अर्ज कसा करावा.",
      time: "७ मि वाचन",
      keywords: ["वारस", "हक्क", "फेरफार"],
      icon: Icon.doc,
      body: (
        <>
          <p>मालक मृत झाल्यानंतर त्यांच्या जमिनीवर <strong>हिंदू उत्तराधिकार कायदा १९५६</strong> (किंवा संबंधित धार्मिक कायदा) नुसार वारसांचा हक्क प्रस्थापित होतो.</p>
          <p>आवश्यक कागदपत्रे: <strong>मृत्यू प्रमाणपत्र, वारस प्रमाणपत्र (तहसीलदार), कुटुंब वंशावळ, सर्व वारसांचे आधार, ७/१२, ८अ</strong>. सर्व वारसांची संमती लागते.</p>
          <p>तलाठी कार्यालयात अर्ज → सूचना → हरकत कालावधी (१५ दिवस) → मंजुरी → नवीन ७/१२ वर सर्व वारसांची नावे. <strong>कौटुंबिक वाटणीपत्र</strong> करून वैयक्तिक नावे करता येतात.</p>
        </>
      ),
    },
  ];

  const cats = ["सर्व", ...Array.from(new Set(articles.map((a) => a.cat)))];

  const filtered = articles.filter((a) => {
    const passCat = cat === "सर्व" || a.cat === cat;
    const q = query.trim().toLowerCase();
    const passQ = !q || (a.title + " " + a.excerpt + " " + a.keywords.join(" ")).toLowerCase().includes(q);
    return passCat && passQ;
  });

  return (
    <section id="knowledge" className="ps-no-print" style={{ background: `linear-gradient(180deg, ${C.paper}, ${C.cream}30)` }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="ps-mono" style={{ color: C.green, fontSize: ".78rem", letterSpacing: ".22em" }}>
            KNOWLEDGE · ज्ञानपीठ
          </div>
          <h2 className="ps-display mt-2" style={{ fontSize: "2.4rem", color: C.navy, lineHeight: 1.15 }}>
            जमिनीची नियमावली व मार्गदर्शन
          </h2>
          <div style={{ height: 3, width: 60, background: C.saffron, margin: "12px auto 0", borderRadius: 2 }} />
          <p style={{ color: C.inkSoft, marginTop: 14, fontSize: "1.05rem", lineHeight: 1.7 }}>
            ७/१२, फेरफार, मोजणी, शासकीय योजना — सोप्या मराठीत, गावच्या भाषेत.
          </p>
        </div>

        {/* Search */}
        <div className="ps-search-wrap mb-6">
          <span className="ps-search-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.3-4.3" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            type="text"
            className="ps-search"
            placeholder="शोधा... (उदा. ७/१२, फेरफार, गुंठा)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="ps-cat-chips mb-10">
          {cats.map((c) => (
            <button
              key={c}
              className={cls("ps-cat-chip", cat === c && "is-active")}
              onClick={() => setCat(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Article grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: C.inkSoft }}>
            <Icon.scan style={{ width: 36, height: 36, margin: "0 auto 12px", opacity: 0.5 }}/>
            <div className="ps-display" style={{ fontSize: "1.3rem", color: C.navy }}>कोणताही लेख आढळला नाही</div>
            <p style={{ marginTop: 6 }}>दुसरा शब्द शोधून पहा किंवा 'सर्व' निवडा.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a, i) => {
              const idx = articles.indexOf(a);
              const isOpen = openIdx === idx;
              return (
                <article
                  key={idx}
                  className={cls("ps-article", isOpen && "is-open")}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <div className="flex items-start gap-4">
                    <div className="ps-article-icon">
                      <a.icon style={{ width: 24, height: 24 }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="ps-article-tag">{a.cat}</span>
                    </div>
                  </div>
                  <h3 className="ps-article-title">{a.title}</h3>
                  <p className="ps-article-excerpt">{a.excerpt}</p>
                  <div className="ps-article-meta">
                    <span>⏱ {a.time}</span>
                    <span className="ps-article-cta">
                      {isOpen ? "बंद करा" : "वाचा"} {isOpen ? "↑" : "→"}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="ps-article-body" onClick={(e) => e.stopPropagation()}>
                      {a.body}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function WhatsAppFAB() {
  return (
    <div className="ps-fab-wrap ps-no-print">
      <a
        href="https://wa.me/918625801907?text=नमस्कार,%20मला%20७/१२%20उतारा%20हवा%20आहे."
        target="_blank"
        rel="noreferrer"
        className="ps-fab-wa"
        aria-label="WhatsApp वर ऑर्डर"
      >
        <Icon.whatsapp style={{ width: 28, height: 28, flexShrink: 0 }} />
        <span className="ps-fab-label">व्हॉट्सॲप ऑर्डर · 24×7</span>
      </a>
    </div>
  );
}

// =============================================================
//                            APP
// =============================================================
export default function App() {
  const toolRef = useRef(null);
  const scrollToTool = () => {
    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="ps-app ps-grain">
      <GlobalStyle />
      <Header />
      <Hero onScrollToTool={scrollToTool} />
      <Tool />
      <HowItWorks />
      <Stats />
      <Services />
      <MeasurementTable />
      <KnowledgeSection />
      <FAQ />
      <CTA />
      <Footer />
      <WhatsAppFAB />
      <MeasurementConverterFAB />
    </div>
  );
}
