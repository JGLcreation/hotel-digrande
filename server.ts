import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from './server/mysqlDb.ts';
import { authMiddleware } from './server/auth.ts';

import authRoutes from './server/routes/auth.ts';
import roomsRoutes from './server/routes/rooms.ts';
import reservationsRoutes from './server/routes/reservations.ts';
import foliosRoutes from './server/routes/folios.ts';
import reportsRoutes from './server/routes/reports.ts';
import servicesRoutes from './server/routes/services.ts';
import conciergeRoutes from './server/routes/concierge.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(authMiddleware);

// Static uploads serving
app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/folios', foliosRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/concierge', conciergeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await initDb();

    if (process.env.NODE_ENV === 'production') {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // In development, hook Vite middleware
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, () => {
      console.log(`The Grand Luxe Hotel Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
