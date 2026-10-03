import { db, initDatabase } from './index.js';

initDatabase();

// 1. Reset puzzle 2 to ACTIVE with ALL 9 TILES LOCKED (so photo is hidden until she eats!)
db.prepare("UPDATE puzzles SET status = 'active', started_at = CURRENT_TIMESTAMP, completed_at = NULL WHERE id = 2").run();
db.prepare("UPDATE tiles SET is_unlocked = 0, unlocked_at = NULL, unlocked_by_meal_log_id = NULL WHERE puzzle_id = 2").run();

// Clean up any old meal logs so today starts fresh for Sonu
db.prepare("DELETE FROM meal_logs").run();

// Remove old starter puzzle so only this puzzle is in the queue
db.prepare("DELETE FROM puzzles WHERE id != 2").run();

console.log('✅ Puzzle 2 is ACTIVE and ALL 9 TILES ARE LOCKED! The photo is completely hidden until she unlocks it by eating meals.');
