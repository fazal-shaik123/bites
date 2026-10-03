import { toZonedTime, format } from 'date-fns-tz';
import { differenceInMinutes } from 'date-fns';
import { config } from '../config.js';

export function getTodayDateString(targetDate: Date = new Date()): string {
  const zonedDate = toZonedTime(targetDate, config.timezone);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: config.timezone });
}

export function getCurrentTimeString(targetDate: Date = new Date()): string {
  const zonedDate = toZonedTime(targetDate, config.timezone);
  return format(zonedDate, 'HH:mm', { timeZone: config.timezone });
}

export function isWithinWindow(currentTime: string, startTime: string, endTime: string): boolean {
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }
  // If window crosses midnight (e.g., 22:00 to 02:00)
  return currentTime >= startTime || currentTime <= endTime;
}

export function hasWindowPassed(currentTime: string, endTime: string): boolean {
  return currentTime > endTime;
}

export function canUndo(loggedAtTimestamp: string | Date, maxMinutes = 10): boolean {
  const logDate = typeof loggedAtTimestamp === 'string' ? new Date(loggedAtTimestamp) : loggedAtTimestamp;
  const now = new Date();
  const diff = differenceInMinutes(now, logDate);
  return diff >= 0 && diff <= maxMinutes;
}
