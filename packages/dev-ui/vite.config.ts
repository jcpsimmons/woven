import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin to serve docs directory
function docsPlugin(): Plugin {
  return {
    name: 'docs-plugin',
    enforce: 'pre', // Run before other plugins
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if this is a docs request
        if (req.url?.startsWith('/storyloom/docs')) {
          const docsPath = path.resolve(__dirname, 'public/docs');
          let filePath: string;

          // Handle root docs path
          if (req.url === '/storyloom/docs' || req.url === '/storyloom/docs/') {
            filePath = path.join(docsPath, 'index.html');
          } else {
            // Remove /storyloom/docs prefix and resolve relative to docs directory
            const relativePath = req.url.replace(/^\/storyloom\/docs/, '') || '/index.html';
            filePath = path.join(docsPath, relativePath);
          }

          // Normalize path to prevent directory traversal
          const normalizedPath = path.normalize(filePath);
          if (!normalizedPath.startsWith(docsPath)) {
            return next();
          }

          if (fs.existsSync(normalizedPath)) {
            const stat = fs.statSync(normalizedPath);
            if (stat.isFile()) {
              res.setHeader('Content-Type', getContentType(normalizedPath));
              return res.end(fs.readFileSync(normalizedPath));
            } else if (stat.isDirectory()) {
              // If it's a directory, try index.html
              const indexPath = path.join(normalizedPath, 'index.html');
              if (fs.existsSync(indexPath)) {
                res.setHeader('Content-Type', 'text/html');
                return res.end(fs.readFileSync(indexPath));
              }
            }
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/storyloom/',
  plugins: [react(), docsPlugin()],
  resolve: {
    alias: {
      storyloom: path.resolve(__dirname, '../core/src'),
    },
  },
  publicDir: 'public',
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
});

function getContentType(filePath: string): string {
  const ext = path.extname(filePath);
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'text/plain';
}
