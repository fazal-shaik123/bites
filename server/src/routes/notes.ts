import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getTodayDateString } from '../services/timeService.js';
import { LoveNote } from '../types.js';

export const notesRouter = Router();

// GET /api/notes/today - Love note(s) for her home screen today
notesRouter.get('/today', requireAuth, (req: Request, res: Response) => {
  const today = getTodayDateString();

  // Find note scheduled for today, or the most recent unscheduled note
  const todayNote = db.prepare(`
    SELECT * FROM love_notes
    WHERE scheduled_for = ?
    ORDER BY id DESC LIMIT 1
  `).get(today) as LoveNote | undefined;

  if (todayNote) {
    return res.json({ note: todayNote });
  }

  // Fallback to the latest unscheduled note or any note
  const generalNote = db.prepare(`
    SELECT * FROM love_notes
    WHERE scheduled_for IS NULL OR scheduled_for <= ?
    ORDER BY id DESC LIMIT 1
  `).get(today) as LoveNote | undefined;

  return res.json({ note: generalNote || null });
});

// GET /api/notes - (Admin) List all love notes
notesRouter.get('/', requireRole('admin'), (req: Request, res: Response) => {
  const notes = db.prepare('SELECT * FROM love_notes ORDER BY id DESC').all();
  return res.json({ notes });
});

// POST /api/notes - (Admin) Create a love note
notesRouter.post('/', requireRole('admin'), (req: Request, res: Response) => {
  const { title, content, scheduled_for } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const result = db.prepare(`
    INSERT INTO love_notes (title, content, scheduled_for)
    VALUES (?, ?, ?)
  `).run(title.trim(), content.trim(), scheduled_for || null);

  const created = db.prepare('SELECT * FROM love_notes WHERE id = ?').get(result.lastInsertRowid);
  return res.json({ success: true, note: created });
});

// PUT /api/notes/:id - (Admin) Update a love note
notesRouter.put('/:id', requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, scheduled_for } = req.body;

  db.prepare(`
    UPDATE love_notes
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        scheduled_for = ?
    WHERE id = ?
  `).run(title, content, scheduled_for || null, id);

  const updated = db.prepare('SELECT * FROM love_notes WHERE id = ?').get(id);
  return res.json({ success: true, note: updated });
});

// DELETE /api/notes/:id - (Admin) Delete a love note
notesRouter.delete('/:id', requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM love_notes WHERE id = ?').run(id);
  return res.json({ success: true });
});
