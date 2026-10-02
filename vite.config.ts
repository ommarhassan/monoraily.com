import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths and on any static host.
  base: './',
  plugins: [react(), tailwindcss()],
});
