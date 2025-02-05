import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  base: '/mortgage-calculator/',
  build: {
    outDir: 'build/client',
    sourcemap: true,
    rollupOptions: {
      input: './index.html',
      external: [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom'
      ]
    }
  },
  server: {
    port: 3000
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '~': '/app'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router', 'react-router-dom']
  }
});
