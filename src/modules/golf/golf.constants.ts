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
  STROKE: 4,
  PUTT: 2,
  OB: 0,
  PENALTY: 0,
} as const;