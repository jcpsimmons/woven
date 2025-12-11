import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/storyloom/',
  plugins: [react()],
  resolve: {
    alias: {
      storyloom: path.resolve(__dirname, '../core/src'),
    },
  },
});
