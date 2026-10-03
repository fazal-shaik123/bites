import { Router, Request, Response } from 'express';
import { differenceInDays, parseISO } from 'date-fns';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { Puzzle, EventLog } from '../types.js';

export const albumRouter = Router();

// GET /api/album - List all completed puzzles
albumRouter.get('/', requireAuth, (req: Request, res: Response) => {
  const completed = db.prepare(`
    SELECT * FROM puzzles WHERE status = 'completed' ORDER BY completed_at DESC
  `).all() as Puzzle[];

  const albumItems = completed.map((p) => {
    let daysTaken = 1;
    if (p.started_at && p.completed_at) {
      const start = parseISO(p.started_at);
      const end = parseISO(p.completed_at);
      daysTaken = Math.max(1, differenceInDays(end, start) + 1);
    }

    return {
      id: p.id,
      title: p.title,
      grid_size: p.grid_size,
      reward_message: p.reward_message,
      started_at: p.started_at,
      completed_at: p.completed_at,
      days_taken: daysTaken,
      fullImageUrl: `/api/puzzles/${p.id}/full-image`
    };
  });

  return res.json({ album: albumItems });
});

// GET /api/album/:puzzleId/timeline - Detailed timeline of tile unlocks
albumRouter.get('/:puzzleId/timeline', requireAuth, (req: Request, res: Response) => {
  const puzzleId = parseInt(req.params.puzzleId, 10);

  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(puzzleId) as Puzzle | undefined;
  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found.' });
  }

  // Only allow completed puzzles or admin view
  if (req.user?.role !== 'admin' && puzzle.status !== 'completed') {
    return res.status(403).json({ error: 'Timeline is only viewable for completed puzzles.' });
  }

  const tilesWithDetails = db.prepare(`
    SELECT 
      t.id as tile_id,
      t.row_idx,
      t.col_idx,
      t.hidden_note,
      t.unlocked_at,
      m.id as meal_log_id,
      m.log_date,
      m.logged_at as meal_logged_at,
      m.note as meal_note,
      c.name as meal_name,
      c.icon as meal_icon
    FROM tiles t
    LEFT JOIN meal_logs m ON t.unlocked_by_meal_log_id = m.id
    LEFT JOIN meals_config c ON m.meal_config_id = c.id
    WHERE t.puzzle_id = ? AND t.is_unlocked = 1
    ORDER BY t.unlocked_at ASC
  `).all(puzzleId);

  const formattedTiles = tilesWithDetails.map((t: any) => ({
    ...t,
    imageUrl: `/api/puzzles/${puzzleId}/tiles/${t.tile_id}/image`
  }));

  let daysTaken = 1;
  if (puzzle.started_at && puzzle.completed_at) {
    daysTaken = Math.max(1, differenceInDays(parseISO(puzzle.completed_at), parseISO(puzzle.started_at)) + 1);
  }

  return res.json({
    puzzle: {
      id: puzzle.id,
      title: puzzle.title,
      grid_size: puzzle.grid_size,
      reward_message: puzzle.reward_message,
      started_at: puzzle.started_at,
      completed_at: puzzle.completed_at,
      days_taken: daysTaken,
      fullImageUrl: `/api/puzzles/${puzzle.id}/full-image`
    },
    timeline: formattedTiles
  });
});

// GET /api/album/events - Complete historical audit of all events
albumRouter.get('/events/all', requireAuth, (req: Request, res: Response) => {
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 200').all() as EventLog[];
  return res.json({ events });
});
