const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_PORT = 3000;
const BACKEND_DIR = path.join(__dirname, 'backend');
const ROOT_DIR = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// --- 1. Backend (starts first) ---
console.log('[1/2] Starting backend on port 4000...');
const backend = spawn('node', ['server.js'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  env: { ...process.env },
});

backend.on('error', (err) => {
  console.error('Backend error:', err.message);
});

backend.on('close', (code) => {
  console.log(`\nBackend exited (code ${code}). Stopping frontend server.`);
  frontendServer.close();
  process.exit(code ?? 0);
});

// --- 2. Frontend static server ---
const frontendServer = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT_DIR, urlPath);

  // Prevent path traversal outside ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR + path.sep) && filePath !== ROOT_DIR) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

frontendServer.listen(FRONTEND_PORT, () => {
  console.log('[2/2] Frontend running on http://localhost:' + FRONTEND_PORT);
  console.log('\nPress Ctrl+C to stop both servers.\n');
});

frontendServer.on('error', (err) => {
  console.error('Frontend server error:', err.message);
});

// --- Graceful shutdown ---
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  frontendServer.close();
  backend.kill();
  process.exit(0);
});
