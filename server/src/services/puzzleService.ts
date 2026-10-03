import { db } from '../db/index.js';
import { Puzzle, Tile } from '../types.js';

export interface UnlockResult {
  unlocked: boolean;
  tile?: Tile | null;
  puzzleCompleted: boolean;
  completedPuzzle?: Puzzle | null;
  message?: string;
}

/**
 * Gets the current active puzzle or activates the next queued puzzle if none is active.
 */
export function getActivePuzzle(): Puzzle | null {
  let active = db.prepare(`
    SELECT * FROM puzzles WHERE status = 'active' ORDER BY queue_order ASC, id ASC LIMIT 1
  `).get() as Puzzle | undefined;

  if (!active) {
    // Check if there is a queued puzzle waiting
    const nextQueued = db.prepare(`
      SELECT * FROM puzzles WHERE status = 'queued' ORDER BY queue_order ASC, id ASC LIMIT 1
    `).get() as Puzzle | undefined;

    if (nextQueued) {
      db.prepare(`
        UPDATE puzzles SET status = 'active', started_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(nextQueued.id);
      active = { ...nextQueued, status: 'active', started_at: new Date().toISOString() };
    }
  }

  return active || null;
}

/**
 * Handles tile unlock upon meal logging.
 * Rule:
 * 1. Each meal slot per day unlocks at most one tile.
 * 2. If already unlocked for this slot today, no new tile is unlocked.
 * 3. Tiles never re-lock.
 * 4. Admin actions never unlock tiles.
 */
export function attemptTileUnlockForMeal(
  mealLogId: number,
  mealConfigId: number,
  logDate: string,
  userRole: string
): UnlockResult {
  // Rule: Admin actions never unlock tiles
  if (userRole !== 'her') {
    return { unlocked: false, puzzleCompleted: false, message: 'Admin actions do not unlock tiles.' };
  }

  // Check if a tile was already unlocked for this meal slot on this day
  const existingUnlockForMeal = db.prepare(`
    SELECT t.id FROM tiles t
    JOIN meal_logs m ON t.unlocked_by_meal_log_id = m.id
    WHERE m.meal_config_id = ? AND m.log_date = ?
    LIMIT 1
  `).get(mealConfigId, logDate) as { id: number } | undefined;

  if (existingUnlockForMeal) {
    return {
      unlocked: false,
      puzzleCompleted: false,
      message: 'A tile was already unlocked for this meal slot today, Sonu! 💕'
    };
  }

  // Anti-cheat: Check if another meal was logged less than 30 minutes ago (sugar-coating / fake)
  const currentLog = db.prepare('SELECT logged_at, user_id FROM meal_logs WHERE id = ?').get(mealLogId) as
    | { logged_at: string; user_id: number }
    | undefined;

  if (currentLog) {
    const recentLog = db.prepare(`
      SELECT logged_at FROM meal_logs 
      WHERE user_id = ? AND id != ?
      ORDER BY logged_at DESC LIMIT 1
    `).get(currentLog.user_id, mealLogId) as { logged_at: string } | undefined;

    if (recentLog) {
      const prevMs = new Date(recentLog.logged_at).getTime();
      const currMs = new Date(currentLog.logged_at).getTime();
      const diffMins = Math.abs(currMs - prevMs) / (1000 * 60);

      if (diffMins < 30) {
        db.prepare(`
          INSERT INTO events (event_type, payload_json) VALUES (?, ?)
        `).run(
          'suspicious_rapid_log',
          JSON.stringify({
            meal_log_id: mealLogId,
            diff_minutes: Math.round(diffMins),
            reason: 'Logged multiple meals at once (sugar-coating / fake)'
          })
        );

        return {
          unlocked: false,
          puzzleCompleted: false,
          message: 'Take your time between meals, Sonu! 💕 We need real spaced meals instead of logging at once!'
        };
      }
    }
  }

  const activePuzzle = getActivePuzzle();
  if (!activePuzzle) {
    return {
      unlocked: false,
      puzzleCompleted: false,
      message: 'No active puzzle currently in progress.'
    };
  }

  // Find remaining locked tiles
  const lockedTiles = db.prepare(`
    SELECT * FROM tiles WHERE puzzle_id = ? AND is_unlocked = 0
  `).all(activePuzzle.id) as Tile[];

  if (lockedTiles.length === 0) {
    // Puzzle might already be full; ensure status is updated
    return {
      unlocked: false,
      puzzleCompleted: true,
      completedPuzzle: activePuzzle,
      message: 'All tiles in the current puzzle are already unlocked!'
    };
  }

  // Pick a random locked tile
  const randomIndex = Math.floor(Math.random() * lockedTiles.length);
  const tileToUnlock = lockedTiles[randomIndex];

  // Unlock the tile
  db.prepare(`
    UPDATE tiles 
    SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP, unlocked_by_meal_log_id = ?
    WHERE id = ?
  `).run(mealLogId, tileToUnlock.id);

  const updatedTile: Tile = {
    ...tileToUnlock,
    is_unlocked: 1,
    unlocked_at: new Date().toISOString(),
    unlocked_by_meal_log_id: mealLogId
  };

  // Log tile unlocked event
  db.prepare(`
    INSERT INTO events (event_type, payload_json) VALUES (?, ?)
  `).run(
    'tile_unlocked',
    JSON.stringify({
      puzzle_id: activePuzzle.id,
      tile_id: updatedTile.id,
      row: updatedTile.row_idx,
      col: updatedTile.col_idx,
      meal_log_id: mealLogId
    })
  );

  // Check if this was the last locked tile
  const remainingCount = (db.prepare(`
    SELECT count(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 0
  `).get(activePuzzle.id) as { count: number }).count;

  let puzzleCompleted = false;
  let completedPuzzle: Puzzle | null = null;

  if (remainingCount === 0) {
    puzzleCompleted = true;
    db.prepare(`
      UPDATE puzzles 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(activePuzzle.id);

    completedPuzzle = db.prepare(`SELECT * FROM puzzles WHERE id = ?`).get(activePuzzle.id) as Puzzle;

    // Log puzzle completed event
    db.prepare(`
      INSERT INTO events (event_type, payload_json) VALUES (?, ?)
    `).run(
      'puzzle_completed',
      JSON.stringify({
        puzzle_id: activePuzzle.id,
        title: activePuzzle.title,
        reward_message: activePuzzle.reward_message
      })
    );

    // Automatically activate the next queued puzzle if one exists
    const nextQueued = db.prepare(`
      SELECT * FROM puzzles WHERE status = 'queued' ORDER BY queue_order ASC, id ASC LIMIT 1
    `).get() as Puzzle | undefined;

    if (nextQueued) {
      db.prepare(`
        UPDATE puzzles SET status = 'active', started_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(nextQueued.id);
      db.prepare(`
        INSERT INTO events (event_type, payload_json) VALUES (?, ?)
      `).run(
        'puzzle_activated',
        JSON.stringify({ puzzle_id: nextQueued.id, title: nextQueued.title })
      );
    }
  }

  return {
    unlocked: true,
    tile: updatedTile,
    puzzleCompleted,
    completedPuzzle
  };
}
