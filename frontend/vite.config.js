import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Route all /api calls to the Express backend (plan §14.3, Step 19)
      "/api": "http://localhost:5000",
      // Uploaded place images are stored and served by the backend
      "/uploads": "http://localhost:5000",
    },
  },
})
