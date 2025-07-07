import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 64'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'spotify': ['./src/hooks/useSpotifyData.js', './src/hooks/useSpotifyPlayerControls.js'],
          'ui': ['./src/components/common/navigation/Sidebar.jsx', './src/components/common/navigation/HorizontalScroll.jsx'],
        },
      },
    },
  },
});