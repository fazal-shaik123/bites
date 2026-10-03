import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadMealPhoto } from '../middleware/upload.js';
import { getTodayDateString, getCurrentTimeString, isWithinWindow, hasWindowPassed, canUndo } from '../services/timeService.js';
import { attemptTileUnlockForMeal } from '../services/puzzleService.js';
import { MealConfig, MealLog } from '../types.js';

export const mealsRouter = Router();

// GET /api/meals/today - Returns today's meal cards with status, window, and undo info
mealsRouter.get('/today', requireAuth, (req: Request, res: Response) => {
  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  const configs = db.prepare(`
    SELECT * FROM meals_config WHERE is_active = 1 ORDER BY display_order ASC
  `).all() as MealConfig[];

  // Get her user ID (or the target "her" user id)
  const herUser = db.prepare("SELECT id FROM users WHERE role = 'her'").get() as { id: number } | undefined;
  const targetUserId = herUser ? herUser.id : req.user!.id;

  const logs = db.prepare(`
    SELECT * FROM meal_logs WHERE user_id = ? AND log_date = ?
  `).all(targetUserId, today) as MealLog[];

  const logsByConfigId = new Map<number, MealLog>();
  logs.forEach((log) => logsByConfigId.set(log.meal_config_id, log));

  const mealCards = configs.map((config) => {
    const log = logsByConfigId.get(config.id);
    const isLogged = !!log;
    const inWindow = isWithinWindow(currentTime, config.start_time, config.end_time);
    const windowPassed = hasWindowPassed(currentTime, config.end_time);
    const undoAvailable = log ? canUndo(log.logged_at) : false;

    return {
      config,
      isLogged,
      log: log
        ? {
            id: log.id,
            logged_at: log.logged_at,
            note: log.note,
            hasPhoto: !!log.photo_path,
            canUndo: undoAvailable
          }
        : null,
      inWindow,
      windowPassed
    };
  });

  return res.json({
    today,
    currentTime,
    meals: mealCards
  });
});

// POST /api/meals/log - (Her only) Log a meal
mealsRouter.post(
  '/log',
  requireRole('her'),
  uploadMealPhoto.single('photo'),
  async (req: Request, res: Response) => {
    const { meal_config_id, note } = req.body;
    const configId = parseInt(meal_config_id, 10);

    if (isNaN(configId)) {
      return res.status(400).json({ error: 'Valid meal_config_id is required.' });
    }

    const mealConfig = db.prepare('SELECT * FROM meals_config WHERE id = ?').get(configId) as MealConfig | undefined;
    if (!mealConfig) {
      return res.status(404).json({ error: 'Meal configuration not found.' });
    }

    const today = getTodayDateString();
    const photoPath = req.file ? req.file.path : null;

    // Insert meal log
    const insertLog = db.prepare(`
      INSERT INTO meal_logs (user_id, meal_config_id, log_date, note, photo_path)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertLog.run(req.user!.id, configId, today, note || null, photoPath);
    const mealLogId = Number(result.lastInsertRowid);

    // Record meal logged event
    db.prepare(`
      INSERT INTO events (event_type, payload_json) VALUES (?, ?)
    `).run(
      'meal_logged',
      JSON.stringify({
        user_id: req.user!.id,
        meal_log_id: mealLogId,
        meal_name: mealConfig.name,
        log_date: today,
        has_note: !!note,
        has_photo: !!photoPath
      })
    );

    // Attempt puzzle tile unlock!
    const unlockResult = attemptTileUnlockForMeal(mealLogId, configId, today, req.user!.role);

    return res.json({
      success: true,
      message: `Yay! Eaten with love! Love you Sonu 💕 💖`,
      mealLogId,
      canUndo: true,
      unlockResult
    });
  }
);

// POST /api/meals/:logId/undo - (Her only) Undo a logged meal within 10 minutes
mealsRouter.post('/undo/:logId', requireRole('her'), (req: Request, res: Response) => {
  const logId = parseInt(req.params.logId, 10);

  const log = db.prepare('SELECT * FROM meal_logs WHERE id = ? AND user_id = ?').get(logId, req.user!.id) as
    | MealLog
    | undefined;

  if (!log) {
    return res.status(404).json({ error: 'Meal log not found.' });
  }

  if (!canUndo(log.logged_at, 10)) {
    return res.status(400).json({ error: 'Undo window (10 minutes) has expired.' });
  }

  // Delete the meal log. Tiles never re-lock!
  db.prepare('DELETE FROM meal_logs WHERE id = ?').run(logId);

  db.prepare(`
    INSERT INTO events (event_type, payload_json) VALUES (?, ?)
  `).run(
    'meal_undone',
    JSON.stringify({ meal_log_id: logId, user_id: req.user!.id, meal_config_id: log.meal_config_id })
  );

  return res.json({
    success: true,
    message: 'Meal log has been undone. Any unlocked puzzle tiles remain unlocked!'
  });
});

// GET /api/meals/history - Calendar / history view with exact timestamps and interval tracking
mealsRouter.get('/history', requireAuth, (req: Request, res: Response) => {
  const herUser = db.prepare("SELECT id FROM users WHERE role = 'her'").get() as { id: number } | undefined;
  if (!herUser) {
    return res.json({ history: [] });
  }

  const rawLogs = db.prepare(`
    SELECT m.id, m.log_date, m.logged_at, m.note, m.photo_path, c.name as meal_name, c.icon as meal_icon
    FROM meal_logs m
    JOIN meals_config c ON m.meal_config_id = c.id
    WHERE m.user_id = ?
    ORDER BY m.logged_at ASC
  `).all(herUser.id) as any[];

  // Calculate intervals between logs to detect sugar-coating / back-to-back entries
  const enrichedLogs = rawLogs.map((log, index) => {
    let intervalMins: number | null = null;
    let isSuspiciousRapid = false;

    if (index > 0) {
      const prev = rawLogs[index - 1];
      const prevMs = new Date(prev.logged_at).getTime();
      const currMs = new Date(log.logged_at).getTime();
      intervalMins = Math.round((currMs - prevMs) / (1000 * 60));
      // Same day and logged within 30 minutes
      if (prev.log_date === log.log_date && intervalMins < 30) {
        isSuspiciousRapid = true;
      }
    }

    return {
      ...log,
      interval_minutes: intervalMins,
      is_suspicious_rapid: isSuspiciousRapid
    };
  });

  // Return newest first
  return res.json({ history: enrichedLogs.reverse() });
});

// GET /api/meals/audit - (Admin only) Full audit log with suspicious events and intervals
mealsRouter.get('/audit', requireRole('admin'), (req: Request, res: Response) => {
  const herUser = db.prepare("SELECT id FROM users WHERE role = 'her'").get() as { id: number } | undefined;
  if (!herUser) {
    return res.json({ audit: [], rapidEvents: [] });
  }

  const rapidEvents = db.prepare(`
    SELECT * FROM events WHERE event_type = 'suspicious_rapid_log' ORDER BY created_at DESC LIMIT 50
  `).all();

  return res.json({ rapidEvents });
});

// ADMIN ROUTES: Meal configuration
mealsRouter.get('/config', requireAuth, (req: Request, res: Response) => {
  const configs = db.prepare('SELECT * FROM meals_config ORDER BY display_order ASC').all();
  return res.json({ configs });
});

mealsRouter.put('/config/:id', requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, icon, start_time, end_time, display_order, is_active } = req.body;

  db.prepare(`
    UPDATE meals_config
    SET name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, icon, start_time, end_time, display_order, is_active, id);

  const updated = db.prepare('SELECT * FROM meals_config WHERE id = ?').get(id);
  return res.json({ success: true, config: updated });
});

mealsRouter.post('/config', requireRole('admin'), (req: Request, res: Response) => {
  const { name, icon, start_time, end_time, display_order } = req.body;
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ error: 'Name, start_time, and end_time are required.' });
  }

  const result = db.prepare(`
    INSERT INTO meals_config (name, icon, start_time, end_time, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(name, icon || '🍽️', start_time, end_time, display_order || 0);

  const created = db.prepare('SELECT * FROM meals_config WHERE id = ?').get(result.lastInsertRowid);
  return res.json({ success: true, config: created });
});
