import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';

const puzzleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.puzzleUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `orig_${Date.now()}_${unique}${ext}`);
  }
});

const mealStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.mealUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `meal_${Date.now()}_${unique}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|webp|gif|heic/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file (JPEG, PNG, WEBP, or HEIC).'));
  }
};

export const uploadPuzzleImage = multer({
  storage: puzzleStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter
});

export const uploadMealPhoto = multer({
  storage: mealStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter
});
