import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { initDatabase } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { mealsRouter } from './routes/meals.js';
import { puzzlesRouter } from './routes/puzzles.js';
import { albumRouter } from './routes/album.js';
import { remindersRouter } from './routes/reminders.js';
import { notesRouter } from './routes/notes.js';

const app = express();

// Initialize SQLite schema
initDatabase();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/puzzles', puzzlesRouter);
app.use('/api/album', albumRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/notes', notesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Bites Server', time: new Date().toISOString() });
});

// Production: serve static client files if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
});

app.listen(config.port, () => {
  console.log(`🌸 Bites Server running on http://localhost:${config.port}`);
  console.log(`🌍 Timezone: ${config.timezone} | Environment: ${config.nodeEnv}`);
});

export default app;
