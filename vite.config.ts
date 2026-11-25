import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'r3f-vendor': ['@react-three/fiber', '@react-three/drei'],
        }
      }
    }
  }
});
