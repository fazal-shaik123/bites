import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const attemptsMap = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function pinRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();
  const record = attemptsMap.get(ip);

  if (record) {
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many incorrect attempts. Please take a gentle breather and try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
      });
    }

    // Reset window if expired
    if (now - record.firstAttemptAt > WINDOW_MS) {
      attemptsMap.delete(ip);
    }
  }

  next();
}

export function recordFailedAttempt(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();
  const record = attemptsMap.get(ip);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attemptsMap.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + WINDOW_MS;
    }
  }
}

export function clearFailedAttempts(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  attemptsMap.delete(ip);
}
