import { db, initDatabase } from './index.js';
import { sliceAndCreateTiles } from '../services/imageService.js';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs';

export async function setSonuPuzzle() {
  initDatabase();
  console.log('Setting up Sonu fitness photo puzzle...');

  // Update user name to Sonu
  db.prepare("UPDATE users SET name = 'Sonu' WHERE role = 'her'").run();
  console.log('Updated user name to Sonu');

  // Deactivate or remove existing puzzles
  db.prepare("UPDATE puzzles SET status = 'completed' WHERE status = 'active'").run();

  const sonuImagePath = path.join(config.puzzleUploadsDir, 'sonu_puzzle.png');
  if (!fs.existsSync(sonuImagePath)) {
    throw new Error('sonu_puzzle.png not found in ' + config.puzzleUploadsDir);
  }

  const notes = [
    'Love you Sonu! You brighten my whole world 💕',
    'Proud of you for eating healthy today, Sonu! 🍓',
    'Every meal you eat makes me so happy, my love 🥞',
    'Nourish your body and mind, sweet Sonu ✨',
    'Almost halfway! Proud of your dedication, Sonu! 💪💖',
    'You deserve the best food and sweetest care 🥐',
    'Sending you the biggest hug, love you Sonu! 🤗',
    'Look at that progress! So proud of you! 🔥',
    'Full photo unlocked! Love you forever, my Sonu! 💖'
  ];

  const insertPuzzle = db.prepare(`
    INSERT INTO puzzles (title, grid_size, original_image_path, reward_message, status, queue_order, started_at)
    VALUES (?, ?, ?, ?, 'active', 0, CURRENT_TIMESTAMP)
  `);

  const result = insertPuzzle.run(
    'Reward for my Sonu 💪✨',
    3,
    sonuImagePath,
    'Special date night & surprise reward, love you Sonu! 🍣🍰💖'
  );

  const puzzleId = Number(result.lastInsertRowid);
  await sliceAndCreateTiles(puzzleId, sonuImagePath, 3, notes);

  db.prepare('INSERT INTO events (event_type, payload_json) VALUES (?, ?)').run(
    'puzzle_created',
    JSON.stringify({ puzzle_id: puzzleId, title: 'Reward for my Sonu 💪✨' })
  );

  console.log(`✅ Sonu puzzle created and active! (ID: ${puzzleId})`);
}

setSonuPuzzle().catch((err) => {
  console.error('Error setting Sonu puzzle:', err);
  process.exit(1);
});
