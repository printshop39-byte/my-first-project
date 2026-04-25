import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // listens on 0.0.0.0 — useful for testing from phone on the same Wi-Fi
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
  },
  // For local dev we proxy /api/* to a local serverless emulator if you run one.
  // For production, the /api routes are handled by Vercel/Netlify functions.
});
