import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  server: {
    port: parseInt(process.env.VITE_CLIENT_PORT || '5173'),
    cors: true, // Enable CORS for the dev server
    proxy: {
      // Simple proxy configuration: all /api requests go to the API server
      '/api': {
        // Explicitly use IPv4 localhost address to avoid IPv6 issues
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
        // No rewriting - server expects the /api prefix
        // Enhanced error handling
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err.message);
            console.error(`Failed to proxy request: ${req?.method} ${req?.url}`);
            
            // Provide a helpful error response to the client
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({
                message: 'API server connection error',
                error: err.message,
                details: 'Make sure the API server is running on port 5002'
              }));
            }
            
            // Attempt to reconnect with retry logic
            console.log('Waiting for API server to become available...');
          });
        }
      }
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});