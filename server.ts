/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import taskRoutes from './src/routes/taskRoutes.ts';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // Mount API routes
  app.use('/api/tasks', taskRoutes);

  // Simple Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', time: new Date().toISOString() });
  });

  // Configured with Vite Dev middleware or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Express in development mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting Express in production mode serving static dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 The Last-Minute Life Saver is running!`);
    console.log(`🔗 Local server url: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
