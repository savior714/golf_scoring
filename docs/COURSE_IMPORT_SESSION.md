# 구장 코스 정보 입력 작업 세션

> 이 파일을 태그하여 새 대화를 시작하면, 아래 맥락 그대로 이어서 진행한다.
> 시작 멘트 예시: "COURSE_IMPORT_SESSION.md 그대로 이어서 코스 정보 입력 작업 시작하자"

---

## 작업 개요

골프장 코스 소개 페이지 URL을 하나씩 받아 Edge Function으로 테스트한 뒤,
문제가 없으면 실제 앱 화면에서 저장한다.

**역할 분담:**
- 나(AI): URL을 Edge Function에 호출 → 결과 파싱 및 이상 여부 판단 → 문제 시 코드 수정
- 사용자: URL 제공 → 앱 화면에서 최종 검토 후 저장

---

## 테스트 방법 (매 URL마다 반복)

```bash
curl -s -X POST "https://eqzobqeotfxvsllforew.supabase.co/functions/v1/course-import" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxem9icWVvdGZ4dnNsbGZvcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjczMjAsImV4cCI6MjA4ODIwMzMyMH0.bbzV2PaIuuBWh1SjkklBFvRc0Qo3kd5GXjmCQMWeQOg" \
  -H "Content-Type: application/json" \
  -d '{"mode":"url","url":"<URL>"}'
```

**판단 기준:**
- `confidence: high` + 전 홀 par/거리 정상 → 사용자에게 앱 저장 안내
- `confidence: medium` → 누락 필드 확인 후 판단
- `confidence: low` 또는 에러 → 원인 파악 후 코드 수정 or 텍스트 모드 안내
- `JS_RENDER_REQUIRED` → 해당 사이트 텍스트 복사해서 `mode: text`로 재시도

---

## 인프라 정보

| 항목 | 값 |
|------|-----|
| Supabase 프로젝트 ID | `eqzobqeotfxvsllforew` |
| Edge Function | `supabase/functions/course-import/index.ts` |
| AI 모델 | `gemini-2.5-flash` |
| 관리자 화면 | `app/(tabs)/admin.tsx` |
| 핵심 로직 | `src/modules/golf/golf.repository.ts` → `registerClub` |

**배포 명령 (코드 수정 후 반드시 실행):**
```powershell
npx supabase functions deploy course-import
```

**git push 시 항상 함께 실행:**
```powershell
git push origin main
npx supabase functions deploy course-import
```

---

## 주요 규칙 및 제약

- **Par 허용 범위:** 3~7 (군산CC 김제=PAR6, 정읍=PAR7 같은 특수 구장 존재)
- **Par 합계 검증:** 고정값(36/72) 아님. 홀별 유효 범위(3~7)만 체크
- **Edge Function 응답:** 항상 HTTP 200. 에러는 `{ error: 'CODE', message: '...' }` 필드로 구분
- **멀티코스 구장:** 코스별 URL을 각각 import → 같은 구장명이면 upsert로 코스 누적 추가됨
- **최종 저장 주체:** 항상 사용자가 앱 화면(관리자 탭)에서 직접 저장

---

## 알려진 에러 패턴

| 증상 | 원인 | 조치 |
|------|------|------|
| `limit: 0` 429 에러 | Gemini API 키 무료 할당량 0 (billing 연결된 GCP 프로젝트) | AI Studio에서 새 프로젝트로 키 재발급 |
| `JS_RENDER_REQUIRED` | 사이트가 JS 렌더링 필요 (텍스트 추출 300자 미만) | 사용자가 페이지 텍스트 복사 후 텍스트 모드 사용 |
| `par: null` + `confidence: low` | 페이지에 PAR 6/7 등 비표준 PAR 존재 시 과거엔 null 처리됨 → 현재는 3~7 허용으로 해결됨. 재현 시 원본 HTML 확인 | 원본 HTML 확인 후 프롬프트 규칙 재조정 |
| 거리값 이상 (예: 963m) | 사이트 원본 데이터 자체의 특수값 (PAR7 롱홀 등) | 사이트 원본 확인 후 실제 값이면 그대로 수용 |

---

## 작업 이력

### 완료된 구장

| 구장명 | 코스 수 | 결과 | 비고 |
|--------|---------|------|------|
| 내장산CC | 2 (홍단풍, 청단풍) | high | - |
| 군산컨트리클럽 | 8 (전주/익산/김제/정읍/부안/남원/토너먼트OUT·IN) | high | 김제 PAR6, 정읍 PAR7 |

### 대기 중인 구장

없음 — 사용자가 다음 URL 제공 예정

---

## 다음 대화 시작 방법

이 파일을 IDE에서 열어 태그한 뒤:

> "COURSE_IMPORT_SESSION.md 그대로 이어서 코스 정보 입력 작업 시작하자"

그러면 AI가 이 파일을 기반으로 바로 URL 받을 준비를 한다.
