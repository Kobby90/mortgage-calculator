import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    outDir: 'build/client',
    sourcemap: true
  },
  server: {
    port: 3000
  },
  base: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/` : '/'
});
