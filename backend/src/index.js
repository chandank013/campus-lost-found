import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import itemsRouter from './routes/items.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/items', itemsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campus-lost-found-backend' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server only when executed directly (not when imported in tests)
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
);

if (isMainModule) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Server] Campus Lost & Found API listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[Server] Startup failed:', err.message);
    });
}

export default app;
