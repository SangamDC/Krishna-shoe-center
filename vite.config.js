import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: if deploying to GitHub Pages at https://<user>.github.io/<repo>/
// set base to "/<repo>/". If deploying to Vercel/Netlify or a custom domain,
// set base to "/".
export default defineConfig({
  plugins: [react()],
  base: "/krishna-shoe-center/",
});
