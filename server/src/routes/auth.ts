import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { JWTPayload, User } from '../types.js';
import { pinRateLimiter, recordFailedAttempt, clearFailedAttempts } from '../middleware/rateLimit.js';
import { verifyToken } from '../middleware/auth.js';
import { seed } from '../db/seed.js';

export const authRouter = Router();

// Disguise page check: allows the hidden dot or Try click to navigate seamlessly
authRouter.get('/disguise-check', (req: Request, res: Response) => {
  const user = verifyToken(req);
  if (!user) {
    return res.json({ loggedIn: false, role: null });
  }
  return res.json({ loggedIn: true, role: user.role, name: user.name });
});

// Instant direct login without password/PIN requirement
authRouter.post('/instant-login', async (req: Request, res: Response) => {
  const role = req.body?.role || 'her';
  let user = db.prepare('SELECT * FROM users WHERE role = ?').get(role) as User | undefined;
  if (!user) {
    await seed();
    user = db.prepare('SELECT * FROM users WHERE role = ?').get(role) as User | undefined;
  }
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const payload: JWTPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });

  res.cookie('bites_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return res.json({
    message: `Welcome, ${user.name}! ✨`,
    user: payload
  });
});

// Current authenticated user session
authRouter.get('/me', (req: Request, res: Response) => {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

// Login with PIN
authRouter.post('/login', pinRateLimiter, async (req: Request, res: Response) => {
  const { role, pin } = req.body;

  if (!role || !pin || (role !== 'her' && role !== 'admin')) {
    return res.status(400).json({ error: 'Please choose an account and enter a 4-digit PIN.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE role = ?').get(role) as User | undefined;
  if (!user) {
    await seed();
    user = db.prepare('SELECT * FROM users WHERE role = ?').get(role) as User | undefined;
  }
  if (!user) {
    recordFailedAttempt(req);
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(String(pin), user.pin_hash);
  if (!isMatch) {
    recordFailedAttempt(req);
    return res.status(401).json({ error: 'Incorrect PIN. Please try again! 🌸' });
  }

  // Clear rate-limiting records on success
  clearFailedAttempts(req);

  const payload: JWTPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '14d' });

  // Set HTTP-only cookie
  res.cookie('bites_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  });

  return res.json({
    message: `Welcome back, ${user.name}! ✨`,
    user: payload
  });
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('bites_token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax'
  });
  return res.json({ message: 'Logged out successfully.' });
});
