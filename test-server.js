/**
 * Simple HTTP server for PKCE OAuth testing
 *
 * Serves the test-pkce-browser.html page on http://localhost:8080
 * This allows OAuth redirects to work properly.
 *
 * Usage: node test-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL to remove query string
  let urlPath = req.url.split('?')[0];

  // Default to test page for root or empty path
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/test-pkce-browser.html';
  }

  // Build full file path
  let filePath = path.join(__dirname, urlPath);

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n=== PKCE Test Server Running ===\n');
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
  console.log(`\nOpen this URL in your browser:`);
  console.log(`  http://127.0.0.1:${PORT}/\n`);
  console.log('Press Ctrl+C to stop the server\n');
});