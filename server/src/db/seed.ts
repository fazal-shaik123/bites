import bcrypt from 'bcryptjs';
import { db, initDatabase } from './index.js';
import { config } from '../config.js';
import { sliceAndCreateTiles } from '../services/imageService.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function seed() {
  initDatabase();
  console.log('🌱 Seeding database...');

  // 1. Seed or update Users
  const herPinHash = await bcrypt.hash(config.herPin, 10);
  const adminPinHash = await bcrypt.hash(config.adminPin, 10);

  const existingHer = db.prepare('SELECT id FROM users WHERE role = ?').get('her') as { id: number } | undefined;
  if (!existingHer) {
    db.prepare('INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)').run(config.herName, herPinHash, 'her');
    console.log(`✅ Created user "${config.herName}" (role: her, PIN: ${config.herPin})`);
  } else {
    db.prepare('UPDATE users SET name = ?, pin_hash = ? WHERE id = ?').run(config.herName, herPinHash, existingHer.id);
    console.log(`🔄 Updated user "${config.herName}" (role: her)`);
  }

  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number } | undefined;
  if (!existingAdmin) {
    db.prepare('INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)').run(config.adminName, adminPinHash, 'admin');
    console.log(`✅ Created user "${config.adminName}" (role: admin, PIN: ${config.adminPin})`);
  } else {
    db.prepare('UPDATE users SET name = ?, pin_hash = ? WHERE id = ?').run(config.adminName, adminPinHash, existingAdmin.id);
    console.log(`🔄 Updated user "${config.adminName}" (role: admin)`);
  }

  // 2. Seed Default Meals if empty
  const mealCount = (db.prepare('SELECT count(*) as count FROM meals_config').get() as { count: number }).count;
  if (mealCount === 0) {
    const insertMeal = db.prepare(`
      INSERT INTO meals_config (name, icon, start_time, end_time, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertMeal.run('Breakfast', '🥞', '07:00', '11:00', 1);
    insertMeal.run('Lunch', '🥗', '12:00', '15:00', 2);
    insertMeal.run('Dinner', '🍲', '18:00', '22:00', 3);
    console.log('✅ Seeded default meals: Breakfast, Lunch, Dinner');
  }

  // 3. Seed Reminder Messages if empty
  const reminderCount = (db.prepare('SELECT count(*) as count FROM reminder_messages').get() as { count: number }).count;
  if (reminderCount === 0) {
    const insertReminder = db.prepare('INSERT INTO reminder_messages (message, is_active) VALUES (?, 1)');
    const reminders = [
      'You forgot lunch, go eat something, love you 💛',
      'Your tummy deserves something warm and delicious right now! 🥪',
      'Gentle check-in: have you had a bite yet today? Thinking of you! ✨',
      'Take a little pause and treat yourself to a tasty meal 💕',
      'Don\'t forget to nourish that lovely mind of yours! 🥑',
      'Pause and get a yummy snack or meal, you\'ve been working so hard! 🌸',
    ];
    for (const msg of reminders) {
      insertReminder.run(msg);
    }
    console.log('✅ Seeded gentle reminders');
  }

  // 4. Seed Love Note if empty
  const noteCount = (db.prepare('SELECT count(*) as count FROM love_notes').get() as { count: number }).count;
  if (noteCount === 0) {
    db.prepare(`
      INSERT INTO love_notes (title, content, scheduled_for)
      VALUES (?, ?, NULL)
    `).run(
      'Welcome to Bites! 💖',
      'I made this little space just for you. Every meal you eat unlocks a piece of a secret photo puzzle! Eat well and take care of yourself, my love.'
    );
    console.log('✅ Seeded initial love note');
  }

  // 5. Seed Starter Puzzle if no active or queued puzzle exists
  const activeOrQueuedCount = (db.prepare("SELECT count(*) as count FROM puzzles WHERE status IN ('active', 'queued')").get() as { count: number }).count;
  if (activeOrQueuedCount === 0) {
    const sonuImagePath = path.join(config.puzzleUploadsDir, 'sonu_puzzle.png');
    if (fs.existsSync(sonuImagePath)) {
      console.log('💪 Setting up active Sonu fitness photo puzzle from image...');
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
      console.log(`✅ Created Sonu fitness photo puzzle (ID: ${puzzleId}) with 9 locked tiles`);
    } else {
      console.log('🎨 Generating starter cute photo puzzle...');
      const starterSvg = `
        <svg width="900" height="900" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFE4E6" />
              <stop offset="50%" stop-color="#FED7AA" />
              <stop offset="100%" stop-color="#FBCFE8" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#F43F5E" flood-opacity="0.25"/>
            </filter>
          </defs>
          <rect width="900" height="900" fill="url(#bg)"/>
          <g filter="url(#shadow)">
            <path d="M 450,750 C 150,550 50,350 200,200 C 300,100 450,220 450,220 C 450,220 600,100 700,200 C 850,350 750,550 450,750 Z"
                  fill="#FB7185" />
          </g>
          <circle cx="200" cy="200" r="18" fill="#FDE047" opacity="0.9" />
          <circle cx="700" cy="220" r="14" fill="#FDE047" opacity="0.9" />
          <circle cx="150" cy="650" r="22" fill="#FDE047" opacity="0.8" />
          <circle cx="750" cy="620" r="20" fill="#FDE047" opacity="0.8" />
          <text x="450" y="420" font-family="sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
            You are so loved! 🍓
          </text>
          <text x="450" y="480" font-family="sans-serif" font-size="28" fill="#FFF1F2" text-anchor="middle">
            Proud of you for eating well today
          </text>
        </svg>
      `;

      const starterImagePath = path.join(config.puzzleUploadsDir, 'starter_puzzle.png');
      await sharp(Buffer.from(starterSvg)).png().toFile(starterImagePath);

      const notes = [
        'You brighten up my whole day! ☀️',
        'Remember to drink some water too! 💧',
        'You are doing wonderfully! 🌸',
        'Proud of you for eating! 🍓',
        'Sending you the biggest hug! 🤗',
        'Take a nice deep breath! ☁️',
        'I love your smile so much! ✨',
        'You deserve yummy food and gentle days! 🥐',
        'Almost done with this puzzle! 💖'
      ];

      const insertPuzzle = db.prepare(`
        INSERT INTO puzzles (title, grid_size, original_image_path, reward_message, status, queue_order, started_at)
        VALUES (?, ?, ?, ?, 'active', 0, CURRENT_TIMESTAMP)
      `);
      const result = insertPuzzle.run(
        'Our First Sweet Puzzle',
        3,
        starterImagePath,
        'Date night: you pick the restaurant & dessert is on me! 🍣🍰'
      );

      const puzzleId = Number(result.lastInsertRowid);
      await sliceAndCreateTiles(puzzleId, starterImagePath, 3, notes);

      db.prepare('INSERT INTO events (event_type, payload_json) VALUES (?, ?)').run(
        'puzzle_created',
        JSON.stringify({ puzzle_id: puzzleId, title: 'Our First Sweet Puzzle' })
      );

      console.log(`✅ Created starter puzzle (ID: ${puzzleId}) with 9 tiles`);
    }
  }

  console.log('🎉 Seeding complete!');
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
