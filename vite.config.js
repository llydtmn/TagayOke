import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Old Android TV / Tizen / webOS browsers
      targets: ['chrome >= 49', 'safari >= 10', 'android >= 5', 'defaults'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
  },
});