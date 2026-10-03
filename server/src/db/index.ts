import Database from 'better-sqlite3';
import { config } from '../config.js';

export const db = new Database(config.dbPath);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('her', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🍽️',
      start_time TEXT NOT NULL, -- HH:mm
      end_time TEXT NOT NULL,   -- HH:mm
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meal_config_id INTEGER NOT NULL,
      log_date TEXT NOT NULL, -- YYYY-MM-DD
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      photo_path TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (meal_config_id) REFERENCES meals_config(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS puzzles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      grid_size INTEGER NOT NULL CHECK(grid_size IN (3, 4, 5)),
      original_image_path TEXT NOT NULL,
      reward_message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'active', 'completed')),
      queue_order INTEGER NOT NULL DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      puzzle_id INTEGER NOT NULL,
      row_idx INTEGER NOT NULL,
      col_idx INTEGER NOT NULL,
      tile_image_path TEXT NOT NULL,
      hidden_note TEXT,
      is_unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at DATETIME,
      unlocked_by_meal_log_id INTEGER,
      FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
      FOREIGN KEY (unlocked_by_meal_log_id) REFERENCES meal_logs(id) ON DELETE SET NULL,
      UNIQUE(puzzle_id, row_idx, col_idx)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminder_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS love_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      scheduled_for TEXT, -- YYYY-MM-DD or null
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(log_date);
    CREATE INDEX IF NOT EXISTS idx_meal_logs_user_meal ON meal_logs(user_id, meal_config_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_puzzles_status ON puzzles(status);
    CREATE INDEX IF NOT EXISTS idx_tiles_puzzle_unlocked ON tiles(puzzle_id, is_unlocked);
  `);
}
