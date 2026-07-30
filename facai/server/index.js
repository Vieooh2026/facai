import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import shipRoutes from './routes/shipments.js';
import productRoutes from './routes/products.js';
import { initWs } from './ws.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipRoutes);
app.use('/api/products', productRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// PWA 清单（确保 MIME 正确）
app.get('/manifest.webmanifest', (_req, res) => {
  res.type('application/manifest+json').sendFile(path.join(publicDir, 'manifest.webmanifest'));
});

// 托管前端构建产物
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = http.createServer(app);
initWs(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`💰 发财致富工作台已启动: http://localhost:${PORT}`);
});
