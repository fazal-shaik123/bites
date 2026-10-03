import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const PUZZLE_UPLOADS_DIR = path.join(UPLOADS_DIR, 'puzzles');
const MEAL_UPLOADS_DIR = path.join(UPLOADS_DIR, 'meals');

// Ensure upload directories exist
[UPLOADS_DIR, PUZZLE_UPLOADS_DIR, MEAL_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'bites_secret_key_change_me_in_prod',
  timezone: process.env.APP_TIMEZONE || 'America/New_York',
  
  // Seed configurations
  herName: process.env.HER_NAME || 'Sonu',
  herPin: process.env.HER_PIN || '1234',
  adminName: process.env.ADMIN_NAME || 'Fazal',
  adminPin: process.env.ADMIN_PIN || '0602',

  // Push notifications
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',

  // Paths
  rootDir: ROOT_DIR,
  dbPath: process.env.DB_PATH || path.join(ROOT_DIR, 'database.sqlite'),
  uploadsDir: UPLOADS_DIR,
  puzzleUploadsDir: PUZZLE_UPLOADS_DIR,
  mealUploadsDir: MEAL_UPLOADS_DIR,
};
