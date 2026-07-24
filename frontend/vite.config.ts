import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.(jsx?|tsx?)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: Number(process.env.FRONTEND_PORT || 3517),
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4517',
        changeOrigin: true,
      },
    },
  },
});
