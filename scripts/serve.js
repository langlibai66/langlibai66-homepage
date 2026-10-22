#!/usr/bin/env node
/**
 * 本地预览服务器：起一个静态文件 server 指向 dist/
 * 与 blog/scripts/serve.js 保持一致的行为
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = parseInt(process.env.PORT || '8080', 10);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml', '.webp': 'image/webp',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
    let url;
    try { url = decodeURIComponent((req.url || '/').split('?')[0]); }
    catch { res.writeHead(400); res.end('Bad Request'); return; }
    const resolved = path.resolve(DIST, '.' + url);
    if (resolved !== DIST && !resolved.startsWith(DIST + path.sep)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }
    let fp = url === '/' ? path.join(DIST, 'index.html') : path.join(DIST, url);
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        // 目录请求：拼 index.html
        fp = path.join(DIST, url, 'index.html');
    }
    if (!fs.existsSync(fp)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found: ' + url);
        return;
    }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🏠 Homepage preview: http://localhost:${PORT}\n`);
});
