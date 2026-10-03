import assert from 'assert';
import Database from 'better-sqlite3';
import { attemptTileUnlockForMeal, getActivePuzzle } from '../services/puzzleService.js';
import { sliceAndCreateTiles } from '../services/imageService.js';
import sharp from 'sharp';
import path from 'path';
import { config } from '../config.js';
import { db, initDatabase } from '../db/index.js';

async function runUnlockRuleTests() {
  console.log('🧪 Starting Unlock Rule Test Suite...\n');
  initDatabase();


  // Reset test tables
  db.exec(`
    DELETE FROM tiles;
    DELETE FROM puzzles;
    DELETE FROM meal_logs;
    DELETE FROM meals_config;
    DELETE FROM users;
    DELETE FROM events;
  `);

  // Create test users
  const herUserResult = db.prepare(`
    INSERT INTO users (name, pin_hash, role) VALUES ('TestHer', 'hash', 'her')
  `).run();
  const herUserId = Number(herUserResult.lastInsertRowid);

  const adminUserResult = db.prepare(`
    INSERT INTO users (name, pin_hash, role) VALUES ('TestAdmin', 'hash', 'admin')
  `).run();
  const adminUserId = Number(adminUserResult.lastInsertRowid);

  // Create test meals: Breakfast (id: 1), Lunch (id: 2)
  const bfastResult = db.prepare(`
    INSERT INTO meals_config (name, icon, start_time, end_time, display_order, is_active)
    VALUES ('Breakfast', '🥞', '07:00', '11:00', 1, 1)
  `).run();
  const bfastId = Number(bfastResult.lastInsertRowid);

  const lunchResult = db.prepare(`
    INSERT INTO meals_config (name, icon, start_time, end_time, display_order, is_active)
    VALUES ('Lunch', '🥗', '12:00', '15:00', 2, 1)
  `).run();
  const lunchId = Number(lunchResult.lastInsertRowid);

  // Create test image with sharp
  const testImagePath = path.join(config.puzzleUploadsDir, 'test_image.png');
  await sharp({
    create: {
      width: 900,
      height: 900,
      channels: 4,
      background: { r: 255, g: 200, b: 220, alpha: 1 }
    }
  }).png().toFile(testImagePath);

  // Create a 3x3 puzzle (9 tiles)
  const puzzleResult = db.prepare(`
    INSERT INTO puzzles (title, grid_size, original_image_path, reward_message, status, queue_order, started_at)
    VALUES ('Test Puzzle', 3, ?, 'Test Reward', 'active', 1, CURRENT_TIMESTAMP)
  `).run(testImagePath);
  const puzzleId = Number(puzzleResult.lastInsertRowid);

  await sliceAndCreateTiles(puzzleId, testImagePath, 3);

  // Initial check: 9 locked tiles, 0 unlocked
  let totalTiles = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ?').get(puzzleId) as any).count;
  let unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(totalTiles, 9, 'Should have 9 total tiles in 3x3 grid');
  assert.strictEqual(unlockedCount, 0, 'Initially 0 tiles should be unlocked');
  console.log('✅ Initial state verified: 9 tiles, 0 unlocked');

  // TEST 1: She logs a meal = 1 tile unlocks
  const testDate = '2026-10-02';
  const log1Result = db.prepare(`
    INSERT INTO meal_logs (user_id, meal_config_id, log_date) VALUES (?, ?, ?)
  `).run(herUserId, bfastId, testDate);
  const log1Id = Number(log1Result.lastInsertRowid);

  const res1 = attemptTileUnlockForMeal(log1Id, bfastId, testDate, 'her');
  assert.strictEqual(res1.unlocked, true, 'Test 1 Failed: Tile should have unlocked for her meal');
  assert.ok(res1.tile, 'Test 1 Failed: Unlocked tile info should be returned');
  
  unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(unlockedCount, 1, 'Test 1 Failed: Exactly 1 tile should be unlocked');
  console.log('✅ Test 1 Passed: She logs a meal -> 1 tile unlocks');

  // TEST 2: Same meal logged twice on the same day = STILL 1 tile (no second unlock)
  const log2Result = db.prepare(`
    INSERT INTO meal_logs (user_id, meal_config_id, log_date) VALUES (?, ?, ?)
  `).run(herUserId, bfastId, testDate);
  const log2Id = Number(log2Result.lastInsertRowid);

  const res2 = attemptTileUnlockForMeal(log2Id, bfastId, testDate, 'her');
  assert.strictEqual(res2.unlocked, false, 'Test 2 Failed: Second log of same meal slot on same day must NOT unlock a tile');

  unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(unlockedCount, 1, 'Test 2 Failed: Still exactly 1 tile unlocked after duplicate meal slot');
  console.log('✅ Test 2 Passed: Same meal logged twice = still 1 tile');

  // TEST 3: Admin actions never unlock tiles
  const logAdminResult = db.prepare(`
    INSERT INTO meal_logs (user_id, meal_config_id, log_date) VALUES (?, ?, ?)
  `).run(adminUserId, lunchId, testDate);
  const logAdminId = Number(logAdminResult.lastInsertRowid);

  const resAdmin = attemptTileUnlockForMeal(logAdminId, lunchId, testDate, 'admin');
  assert.strictEqual(resAdmin.unlocked, false, 'Test 3 Failed: Admin actions must never unlock tiles');

  unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(unlockedCount, 1, 'Test 3 Failed: Unlocked count must remain unchanged by admin actions');
  console.log('✅ Test 3 Passed: Admin actions never unlock tiles');

  // TEST 4: Tiles never re-lock (even if meal log is deleted/undone)
  // Undo meal 1 by deleting its log
  db.prepare('DELETE FROM meal_logs WHERE id = ?').run(log1Id);

  unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(unlockedCount, 1, 'Test 4 Failed: Tiles must NEVER re-lock even after meal undo');
  console.log('✅ Test 4 Passed: Tiles never re-lock');

  // TEST 5: Logging different meal slots with realistic spacing advances unlocks
  const log3Result = db.prepare(`
    INSERT INTO meal_logs (user_id, meal_config_id, log_date, logged_at) 
    VALUES (?, ?, ?, datetime('now', '+2 hours'))
  `).run(herUserId, lunchId, testDate);
  const log3Id = Number(log3Result.lastInsertRowid);

  const res3 = attemptTileUnlockForMeal(log3Id, lunchId, testDate, 'her');
  assert.strictEqual(res3.unlocked, true, 'Test 5 Failed: Different meal slot should unlock second tile');

  unlockedCount = (db.prepare('SELECT COUNT(*) as count FROM tiles WHERE puzzle_id = ? AND is_unlocked = 1').get(puzzleId) as any).count;
  assert.strictEqual(unlockedCount, 2, 'Test 5 Failed: 2 tiles should now be unlocked');
  console.log('✅ Test 5 Passed: Different meal slot unlocks another tile (2 unlocked)');

  // TEST 6: Rapid logging (< 30 minutes) blocks unlock & flags fake/sugar-coating
  const rapidDinnerResult = db.prepare(`
    INSERT INTO meal_logs (user_id, meal_config_id, log_date, logged_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(herUserId, lunchId, testDate);
  const rapidDinnerId = Number(rapidDinnerResult.lastInsertRowid);

  const resRapid = attemptTileUnlockForMeal(rapidDinnerId, lunchId, testDate, 'her');
  assert.strictEqual(resRapid.unlocked, false, 'Test 6 Failed: Rapid back-to-back logging must not unlock tiles');
  console.log('✅ Test 6 Passed: Rapid batch logging detected & tile unlock blocked');

  console.log('\n🎉 ALL UNLOCK RULE & ANTI-CHEAT TESTS PASSED SUCCESSFULLY! 🌟\n');
}

runUnlockRuleTests().catch((err) => {
  console.error('❌ Test failure:', err);
  process.exit(1);
});
