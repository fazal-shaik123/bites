import { Router, Request, Response } from 'express';
import fs from 'fs';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadPuzzleImage } from '../middleware/upload.js';
import { getActivePuzzle } from '../services/puzzleService.js';
import { sliceAndCreateTiles } from '../services/imageService.js';
import { Puzzle, Tile } from '../types.js';

export const puzzlesRouter = Router();

// GET /api/puzzles/active - Get current puzzle state
puzzlesRouter.get('/active', requireAuth, (req: Request, res: Response) => {
  const activePuzzle = getActivePuzzle();
  if (!activePuzzle) {
    return res.json({ puzzle: null, tiles: [] });
  }

  const allTiles = db.prepare(`
    SELECT * FROM tiles WHERE puzzle_id = ? ORDER BY row_idx ASC, col_idx ASC
  `).all(activePuzzle.id) as Tile[];

  const isUserAdmin = req.user?.role === 'admin';
  const isCompleted = activePuzzle.status === 'completed';

  // Securely redact locked tiles for her
  const sanitizedTiles = allTiles.map((tile) => {
    if (tile.is_unlocked === 1 || isCompleted || isUserAdmin) {
      return {
        id: tile.id,
        puzzle_id: tile.puzzle_id,
        row_idx: tile.row_idx,
        col_idx: tile.col_idx,
        is_unlocked: tile.is_unlocked,
        unlocked_at: tile.unlocked_at,
        hidden_note: tile.hidden_note,
        imageUrl: `/api/puzzles/${activePuzzle.id}/tiles/${tile.id}/image`
      };
    }

    // Locked tile: strictly no image URL, no note, no file path
    return {
      id: tile.id,
      puzzle_id: tile.puzzle_id,
      row_idx: tile.row_idx,
      col_idx: tile.col_idx,
      is_unlocked: 0
    };
  });

  const totalTiles = sanitizedTiles.length;
  const unlockedCount = allTiles.filter((t) => t.is_unlocked === 1).length;

  return res.json({
    puzzle: {
      id: activePuzzle.id,
      title: activePuzzle.title,
      grid_size: activePuzzle.grid_size,
      reward_message: activePuzzle.reward_message,
      status: activePuzzle.status,
      started_at: activePuzzle.started_at,
      completed_at: activePuzzle.completed_at,
      total_tiles: totalTiles,
      unlocked_tiles: unlockedCount,
      is_completed: isCompleted,
      fullImageUrl: isCompleted || isUserAdmin ? `/api/puzzles/${activePuzzle.id}/full-image` : null
    },
    tiles: sanitizedTiles
  });
});

// GET /api/puzzles/:puzzleId/tiles/:tileId/image - Secure endpoint for unlocked tile images
puzzlesRouter.get('/:puzzleId/tiles/:tileId/image', requireAuth, (req: Request, res: Response) => {
  const puzzleId = parseInt(req.params.puzzleId, 10);
  const tileId = parseInt(req.params.tileId, 10);

  const tile = db.prepare('SELECT * FROM tiles WHERE id = ? AND puzzle_id = ?').get(tileId, puzzleId) as Tile | undefined;
  if (!tile) {
    return res.status(404).json({ error: 'Tile not found.' });
  }

  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(puzzleId) as Puzzle | undefined;
  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found.' });
  }

  // Security check: if user is 'her', tile must be unlocked or puzzle completed!
  if (req.user?.role !== 'admin' && tile.is_unlocked !== 1 && puzzle.status !== 'completed') {
    return res.status(403).json({ error: 'Tile is still locked! 🔒 Keep eating your yummy meals to unlock it!' });
  }

  if (!fs.existsSync(tile.tile_image_path)) {
    return res.status(404).json({ error: 'Tile image file missing.' });
  }

  return res.sendFile(tile.tile_image_path);
});

// GET /api/puzzles/:puzzleId/full-image - Secure endpoint for full original image
puzzlesRouter.get('/:puzzleId/full-image', requireAuth, (req: Request, res: Response) => {
  const puzzleId = parseInt(req.params.puzzleId, 10);

  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(puzzleId) as Puzzle | undefined;
  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found.' });
  }

  // Full image is strictly restricted to admin or completed puzzles
  if (req.user?.role !== 'admin' && puzzle.status !== 'completed') {
    return res.status(403).json({ error: 'Full photo is hidden until the entire puzzle is completed! ✨' });
  }

  if (!fs.existsSync(puzzle.original_image_path)) {
    return res.status(404).json({ error: 'Photo file missing.' });
  }

  return res.sendFile(puzzle.original_image_path);
});

// ADMIN ROUTES: Puzzle management
puzzlesRouter.post('/', requireRole('admin'), uploadPuzzleImage.single('photo'), async (req: Request, res: Response) => {
  try {
    const { title, grid_size, reward_message, notes_json } = req.body;
    const gridSize = parseInt(grid_size, 10);

    if (!req.file) {
      return res.status(400).json({ error: 'Photo file is required.' });
    }
    if (!title || !gridSize || ![3, 4, 5].includes(gridSize)) {
      return res.status(400).json({ error: 'Title and valid grid size (3, 4, or 5) are required.' });
    }
    if (!reward_message) {
      return res.status(400).json({ error: 'Reward message is required.' });
    }

    let tileNotes: string[] = [];
    if (notes_json) {
      try {
        tileNotes = JSON.parse(notes_json);
      } catch (err) {
        // fallback
      }
    }

    // Check if there is an active puzzle
    const currentActive = db.prepare("SELECT id FROM puzzles WHERE status = 'active'").get();
    const shouldBeActive = !currentActive;

    const maxQueue = db.prepare('SELECT MAX(queue_order) as maxOrder FROM puzzles').get() as { maxOrder: number | null };
    const nextOrder = (maxQueue.maxOrder ?? 0) + 1;

    const insertPuzzle = db.prepare(`
      INSERT INTO puzzles (title, grid_size, original_image_path, reward_message, status, queue_order, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const status = shouldBeActive ? 'active' : 'queued';
    const startedAt = shouldBeActive ? new Date().toISOString() : null;

    const result = insertPuzzle.run(
      title,
      gridSize,
      req.file.path,
      reward_message,
      status,
      nextOrder,
      startedAt
    );

    const puzzleId = Number(result.lastInsertRowid);

    // Slice image into tiles with Sharp
    await sliceAndCreateTiles(puzzleId, req.file.path, gridSize, tileNotes);

    db.prepare('INSERT INTO events (event_type, payload_json) VALUES (?, ?)').run(
      'puzzle_created',
      JSON.stringify({ puzzle_id: puzzleId, title, grid_size: gridSize, status })
    );

    return res.status(201).json({
      success: true,
      message: `Puzzle "${title}" created and ${status === 'active' ? 'activated' : 'queued'}!`,
      puzzleId
    });
  } catch (err: any) {
    console.error('Error creating puzzle:', err);
    return res.status(500).json({ error: err.message || 'Failed to create puzzle.' });
  }
});

// GET /api/puzzles/queue - (Admin) Get all queued, active, and completed puzzles
puzzlesRouter.get('/queue', requireRole('admin'), (req: Request, res: Response) => {
  const allPuzzles = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM tiles WHERE puzzle_id = p.id) as total_tiles,
      (SELECT COUNT(*) FROM tiles WHERE puzzle_id = p.id AND is_unlocked = 1) as unlocked_tiles
    FROM puzzles p
    ORDER BY 
      CASE p.status 
        WHEN 'active' THEN 1 
        WHEN 'queued' THEN 2 
        WHEN 'completed' THEN 3 
      END,
      p.queue_order ASC,
      p.id ASC
  `).all();

  return res.json({ puzzles: allPuzzles });
});

// PUT /api/puzzles/queue/reorder - (Admin) Reorder puzzle queue
puzzlesRouter.put('/queue/reorder', requireRole('admin'), (req: Request, res: Response) => {
  const { orderList } = req.body as { orderList: { id: number; queue_order: number }[] };

  if (!Array.isArray(orderList)) {
    return res.status(400).json({ error: 'orderList array is required.' });
  }

  const updateStmt = db.prepare('UPDATE puzzles SET queue_order = ? WHERE id = ?');
  const transaction = db.transaction(() => {
    for (const item of orderList) {
      updateStmt.run(item.queue_order, item.id);
    }
  });

  transaction();
  return res.json({ success: true, message: 'Queue updated!' });
});

// PUT /api/puzzles/:puzzleId - (Admin) Update title, reward, or notes
puzzlesRouter.put('/:puzzleId', requireRole('admin'), (req: Request, res: Response) => {
  const puzzleId = parseInt(req.params.puzzleId, 10);
  const { title, reward_message, tile_notes } = req.body;

  db.prepare(`
    UPDATE puzzles
    SET title = COALESCE(?, title),
        reward_message = COALESCE(?, reward_message)
    WHERE id = ?
  `).run(title, reward_message, puzzleId);

  if (Array.isArray(tile_notes)) {
    const updateTileNote = db.prepare('UPDATE tiles SET hidden_note = ? WHERE id = ? AND puzzle_id = ?');
    for (const tn of tile_notes) {
      if (tn.id) {
        updateTileNote.run(tn.hidden_note || null, tn.id, puzzleId);
      }
    }
  }

  return res.json({ success: true, message: 'Puzzle updated!' });
});

// DELETE /api/puzzles/:puzzleId - (Admin) Delete a puzzle
puzzlesRouter.delete('/:puzzleId', requireRole('admin'), (req: Request, res: Response) => {
  const puzzleId = parseInt(req.params.puzzleId, 10);
  db.prepare('DELETE FROM puzzles WHERE id = ?').run(puzzleId);
  return res.json({ success: true, message: 'Puzzle removed.' });
});
