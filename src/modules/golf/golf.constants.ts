export const TEE_COLORS = {
  WHITE: 'White',
  BLACK: 'Black',
  BLUE: 'Blue',
  RED: 'Red',
  GOLD: 'Gold',
} as const;

export const MISS_SHOT_PATTERNS = {
  NONE: '없음',
  THREE_PUTT: '3-Putt',
  BUNKER: 'Bunker',
  OB: 'OB',
  PENALTY: 'Penalty',
} as const;

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;

export const DEFAULT_SCORES = {
  PAR: 4,
  STROKE: 1,
  PUTT: 0,
  OB: 0,
  PENALTY: 0,
} as const;

export const GOLF_LIMITS = {
  MAX_DAILY_ROUNDS: 10,
} as const;