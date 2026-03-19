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

// 코스명 표시용 파싱 결과 타입
export type CourseDisplayParts = {
  label: string;
  direction: 'OUT' | 'IN' | null;
  suffix: 'Course' | '코스';
};

/**
 * DB 원본 코스명을 표시 레이어에서 정규화하는 순수 함수 (SSOT)
 *
 * 지원 패턴:
 *  - "Lake Course"   → { label: "Lake",  direction: null }
 *  - "섬진코스"       → { label: "섬진",   direction: null }
 *  - "홍단풍 (OUT)"  → { label: "홍단풍", direction: "OUT" }
 *  - "OUT"           → { label: "전반",   direction: "OUT" }
 *  - "IN"            → { label: "후반",   direction: "IN"  }
 */
export function parseCourseDisplayName(raw: string): CourseDisplayParts {
  const trimmed = raw.trim();

  // 1. 순수 방향 문자열 단독 처리 ("OUT" / "IN")
  if (/^(OUT|IN)$/i.test(trimmed)) {
    const direction = trimmed.toUpperCase() as 'OUT' | 'IN';
    return { label: direction === 'OUT' ? '전반' : '후반', direction, suffix: '코스' };
  }

  // 2. "(OUT)" / "(IN)" 괄호 추출
  const dirMatch = trimmed.match(/\((OUT|IN)\)/i);
  const direction = dirMatch ? (dirMatch[1].toUpperCase() as 'OUT' | 'IN') : null;

  // 3. suffix 제거: "(OUT)"/"(IN)" 괄호, " Course", "코스", 앞뒤 공백
  const label = trimmed
    .replace(/\s*\((OUT|IN)\)/gi, '')
    .replace(/\s+Course$/i, '')
    .replace(/코스$/, '')
    .trim();

  // 4. label 언어 계열 판별: 순수 라틴 문자 → 'Course', 그 외(한글 포함) → '코스'
  const suffix = /^[A-Za-z\s]+$/.test(label) ? 'Course' : '코스';

  return { label, direction, suffix };
}