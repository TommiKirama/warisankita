import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api to the Node backend so the SPA and API share an origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // listen on all network interfaces so other devices on the LAN can connect
    allowedHosts: true, // allow tunnel hostnames (ngrok / cloudflared) during demos
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
