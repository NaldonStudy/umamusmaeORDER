export const TOTAL_DISTANCE = 1000;
export const TICK_INTERVAL_MS = 50;
export const COUNTDOWN_INTERVAL_MS = 900;
export const COUNTDOWN_START = 3;

export const BASE_SPEED_MIN = 4.5;
export const BASE_SPEED_MAX = 6.5;
export const BASE_SPEED_TIERS = [4.8, 5.2, 5.5, 5.8, 6.1, 6.4] as const;

export const STAMINA_DRAIN_RATE = 0.25;
export const STAMINA_SPEED_PENALTY_THRESHOLD = 20;

export const MAX_TEAMS = 12;
export const MIN_TEAMS_TO_START = 2;

export const TEAM_COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#a855f7', '#ef4444',
] as const;

export const TEAM_EMOJIS = [
  '🐎', '🦄', '🐴', '🏇', '⭐', '🌸', '💫', '🌟', '🔥', '⚡', '🌈', '🎀',
] as const;
