import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getTodayDateString, getCurrentTimeString, hasWindowPassed } from '../services/timeService.js';
import { getVapidPublicKey, sendPushNotification } from '../services/notificationService.js';
import { MealConfig, MealLog, ReminderMessage } from '../types.js';

export const remindersRouter = Router();

// GET /api/reminders/active-banner - Computes if a gentle reminder should be shown right now
remindersRouter.get('/active-banner', requireAuth, (req: Request, res: Response) => {
  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  const herUser = db.prepare("SELECT id FROM users WHERE role = 'her'").get() as { id: number } | undefined;
  if (!herUser) {
    return res.json({ showBanner: false });
  }

  // Get active meals
  const meals = db.prepare(`
    SELECT * FROM meals_config WHERE is_active = 1 ORDER BY display_order ASC
  `).all() as MealConfig[];

  const logs = db.prepare(`
    SELECT meal_config_id FROM meal_logs WHERE user_id = ? AND log_date = ?
  `).all(herUser.id, today) as { meal_config_id: number }[];

  const loggedSet = new Set(logs.map((l) => l.meal_config_id));

  // Find meals whose window has passed today and were not logged
  const unloggedPassedMeals = meals.filter((meal) => {
    return hasWindowPassed(currentTime, meal.end_time) && !loggedSet.has(meal.id);
  });

  if (unloggedPassedMeals.length === 0) {
    return res.json({ showBanner: false });
  }

  // Pick the most recent passed meal
  const missedMeal = unloggedPassedMeals[unloggedPassedMeals.length - 1];

  // Pick a random active gentle reminder message
  const messages = db.prepare(`
    SELECT * FROM reminder_messages WHERE is_active = 1
  `).all() as ReminderMessage[];

  let selectedMessage = `You forgot ${missedMeal.name.toLowerCase()}, go eat something, love you 💛`;
  if (messages.length > 0) {
    const randomIdx = Math.floor(Math.random() * messages.length);
    selectedMessage = messages[randomIdx].message.replace(/{meal}/gi, missedMeal.name);
  }

  return res.json({
    showBanner: true,
    mealName: missedMeal.name,
    message: selectedMessage
  });
});

// GET /api/reminders - List all reminder messages (for admin management)
remindersRouter.get('/', requireRole('admin'), (req: Request, res: Response) => {
  const messages = db.prepare('SELECT * FROM reminder_messages ORDER BY id DESC').all();
  return res.json({ reminders: messages });
});

// POST /api/reminders - Add reminder message
remindersRouter.post('/', requireRole('admin'), (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const result = db.prepare('INSERT INTO reminder_messages (message, is_active) VALUES (?, 1)').run(message.trim());
  const created = db.prepare('SELECT * FROM reminder_messages WHERE id = ?').get(result.lastInsertRowid);
  return res.json({ success: true, reminder: created });
});

// PUT /api/reminders/:id - Update reminder message
remindersRouter.put('/:id', requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, is_active } = req.body;

  db.prepare(`
    UPDATE reminder_messages 
    SET message = COALESCE(?, message), is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(message, is_active, id);

  const updated = db.prepare('SELECT * FROM reminder_messages WHERE id = ?').get(id);
  return res.json({ success: true, reminder: updated });
});

// DELETE /api/reminders/:id - Delete reminder message
remindersRouter.delete('/:id', requireRole('admin'), (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM reminder_messages WHERE id = ?').run(id);
  return res.json({ success: true });
});

// Web Push endpoints
remindersRouter.get('/vapid-public-key', (req: Request, res: Response) => {
  return res.json({ publicKey: getVapidPublicKey() });
});

remindersRouter.post('/push-subscription', requireAuth, (req: Request, res: Response) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Valid push subscription required.' });
  }

  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, keys_json)
    VALUES (?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET keys_json = excluded.keys_json
  `).run(subscription.endpoint, JSON.stringify(subscription.keys));

  return res.json({ success: true, message: 'Push subscription registered.' });
});

remindersRouter.post('/test-push', requireRole('admin'), async (req: Request, res: Response) => {
  const { message } = req.body;
  const result = await sendPushNotification({
    title: 'Bites Meal Reminder 🍽️',
    body: message || "Gentle reminder: have you eaten yet? Love you! 💛",
    url: '/app'
  });
  return res.json(result);
});
