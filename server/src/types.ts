export type UserRole = 'her' | 'admin';

export interface User {
  id: number;
  name: string;
  pin_hash: string;
  role: UserRole;
  created_at: string;
}

export interface MealConfig {
  id: number;
  name: string;
  icon: string;
  start_time: string; // HH:mm format, e.g. "07:00"
  end_time: string;   // HH:mm format, e.g. "11:00"
  display_order: number;
  is_active: number;  // 1 or 0
}

export interface MealLog {
  id: number;
  user_id: number;
  meal_config_id: number;
  log_date: string;   // YYYY-MM-DD
  logged_at: string;  // ISO timestamp
  note?: string;
  photo_path?: string;
}

export type PuzzleStatus = 'queued' | 'active' | 'completed';

export interface Puzzle {
  id: number;
  title: string;
  grid_size: number; // 3, 4, or 5
  original_image_path: string;
  reward_message: string;
  status: PuzzleStatus;
  queue_order: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Tile {
  id: number;
  puzzle_id: number;
  row_idx: number;
  col_idx: number;
  tile_image_path: string;
  hidden_note?: string;
  is_unlocked: number; // 1 or 0
  unlocked_at?: string;
  unlocked_by_meal_log_id?: number;
}

export interface EventLog {
  id: number;
  event_type: 'meal_logged' | 'meal_undone' | 'tile_unlocked' | 'puzzle_created' | 'puzzle_completed';
  payload_json: string;
  created_at: string;
}

export interface ReminderMessage {
  id: number;
  message: string;
  is_active: number;
}

export interface LoveNote {
  id: number;
  title: string;
  content: string;
  scheduled_for?: string; // YYYY-MM-DD or null
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: number;
  endpoint: string;
  keys_json: string;
  created_at: string;
}

// Request payload types
export interface JWTPayload {
  id: number;
  name: string;
  role: UserRole;
}
