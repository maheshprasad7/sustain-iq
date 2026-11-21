import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const tryServe = (p) => {
    fs.stat(p, (err, stats) => {
      if (err || !stats.isFile()) {
        if (!p.includes(path.join(__dirname, 'public'))) {
          // fallback to public folder
          const fallbackPath = path.join(__dirname, 'public', urlPath);
          return tryServe(fallbackPath);
        }
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const ext = path.extname(p).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.woff2'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);

      const stream = fs.createReadStream(p);
      stream.pipe(res);
    });
  };

  tryServe(filePath);
});

let currentPort = Number(PORT);

function startServer(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${currentPort} is in use, trying next port...`);
    currentPort += 1;
    startServer(currentPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(currentPort);
