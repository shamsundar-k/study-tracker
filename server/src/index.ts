import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { join } from 'path';

import authRouter from './routes/auth.js';
import itemsRouter from './routes/items.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Compiled file: server/dist/index.js → ../../client/dist = client/dist from monorepo root
const clientDist = join(__dirname, '..', '..', 'client', 'dist');

// ── Middleware ────────────────────────────────────────────────────────────────
if (!isProduction) {
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
}
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);

// ── Root status page (dev only — production serves React index.html) ─────────
if (!isProduction) app.get('/', (_req, res) => {
  const db = mongoose.connection.readyState;
  const dbStatus: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Study Tracker API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2.5rem 3rem;
      max-width: 480px;
      width: 100%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
    }
    .badge.ok  { background: #14532d; color: #86efac; }
    .badge.err { background: #450a0a; color: #fca5a5; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.5rem; }
    p  { font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    td { padding: 0.5rem 0; border-bottom: 1px solid #334155; }
    td:first-child { color: #94a3b8; width: 40%; }
    td:last-child  { color: #e2e8f0; font-weight: 500; }
    tr:last-child td { border-bottom: none; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
    .dot.green { background: #22c55e; }
    .dot.red   { background: #ef4444; }
    .dot.amber { background: #f59e0b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge ${db === 1 ? 'ok' : 'err'}">
      ${db === 1 ? '✓ Server is running' : '✗ DB not connected'}
    </div>
    <h1>📚 Study Tracker API</h1>
    <p>Backend is up. Use the endpoints below from the React frontend.</p>
    <table>
      <tr>
        <td>Environment</td>
        <td>${process.env.NODE_ENV ?? 'development'}</td>
      </tr>
      <tr>
        <td>Database</td>
        <td>
          <span class="dot ${db === 1 ? 'green' : db === 2 ? 'amber' : 'red'}"></span>
          ${dbStatus[db] ?? 'unknown'}
        </td>
      </tr>
      <tr>
        <td>CORS origin</td>
        <td style="word-break:break-all">${CLIENT_URL}</td>
      </tr>
      <tr>
        <td>API base</td>
        <td>/api/auth &amp; /api/items</td>
      </tr>
      <tr>
        <td>Health check</td>
        <td><a href="/health" style="color:#818cf8">/health</a></td>
      </tr>
    </table>
  </div>
</body>
</html>`);
});

// ── Health check (JSON — for uptime monitors) ─────────────────────────────────
app.get('/health', (_req, res) => {
  const db = mongoose.connection.readyState;
  res.status(db === 1 ? 200 : 503).json({
    status: db === 1 ? 'ok' : 'degraded',
    db: db === 1 ? 'connected' : 'disconnected',
  });
});

// ── Production: serve React build + catch-all for React Router ────────────────
if (isProduction) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// ── DB + Server ───────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI ?? '';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
