# 구장 정보 자동 입력 시스템 계획서

## 1. 현황 및 문제 정의

### 현재 워크플로우 (수동)
1. 구장 홈페이지에 직접 접속
2. 코스 소개 페이지에서 홀별 Par, 전장(야드/미터), 코스명 확인
3. 앱의 관리자 화면에서 구장명 → 코스명 → 홀별 데이터를 하나씩 직접 입력
4. 18홀 기준 최소 54개 셀(홀번호 × Par + 전장) 수동 입력

### 핵심 문제
- **시간 비용**: 9홀 코스 1개 입력에 약 10~15분 소요, 구장 1개(보통 3~4코스) 기준 30~60분
- **오입력 리스크**: 수동 입력 시 Par나 전장 오기재 가능성
- **확장성 한계**: 구장 수가 늘어날수록 관리자 부담 선형 증가
- **정보 불일치**: 코스 리뉴얼(Par 변경, 전장 조정) 시 업데이트 누락

---

## 2. 목표

**구장 코스 소개 페이지 URL 하나만 입력하면 홀별 Par, 전장, 코스명이 자동으로 채워지고, 관리자는 검토 후 저장만 하면 된다.**

| 지표 | 현재 | 목표 |
|------|------|------|
| 구장 1개 입력 시간 | 30~60분 | 2~3분 (검토 포함) |
| 오입력 가능성 | 높음 | 낮음 (AI 추출 + 사람 검토) |
| 코스 업데이트 반영 | 수동 | 재추출 후 비교 적용 |

---

## 3. 시스템 아키텍처

```
[관리자 앱]
    │
    │  1. 구장 코스 소개 페이지 URL 붙여넣기 (관리자가 직접 탐색)
    ▼
[Supabase Edge Function: course-import]
    │
    ├─ A. 정적 HTML 응답 시 (대부분의 구장 사이트)
    │       └─ fetch(url) → HTML 취득 → Claude API 파싱
    │
    └─ B. JS 렌더링 필요 사이트 (fetch 실패 또는 LOW 신뢰도)
            └─ 에러 응답 반환
                    └─ 앱이 "텍스트 붙여넣기" 모드로 전환 안내
                            └─ 관리자가 브라우저에서 표 텍스트 복사 → 앱에 붙여넣기
                                    └─ Claude API가 텍스트 파싱
    │
    ▼
[AI 파싱 레이어: Claude API (claude-sonnet-4-6)]
    │  HTML 또는 붙여넣은 텍스트 → 코스명, 홀번호, Par, 전장 추출
    ▼
[구조화 응답 JSON]
    │
    ▼
[관리자 앱 Preview UI]
    │
    │  2. 관리자 검토 및 수정 후 저장
    ▼
[Supabase DB 저장]
    golf_clubs → golf_courses → golf_holes → hole_distances
```

**핵심 원칙: URL 탐색은 관리자가 직접 수행한다.**
어차피 현재도 구장 홈페이지에 직접 들어가서 코스 페이지를 찾고 있으므로, URL 복사 한 번으로 자동화의 80%가 해결된다. 검색 자동화에 드는 외부 API 비용과 의존성을 제거한다.

---

## 4. 입력 방식 전략 (비용 0원 기준)

### 4-1. 주 경로: URL → 정적 HTML 크롤링

관리자가 구장 코스 소개 페이지 URL을 직접 찾아 붙여넣기 한다.
(현재도 이 페이지에 직접 접속하고 있으므로 동선 변화 없음)

```
관리자 행동: 구장 홈페이지 → 코스 소개 탭 → URL 복사 → 앱에 붙여넣기
```

| 항목 | 내용 |
|------|------|
| 서버 비용 | 무료 (Deno fetch) |
| 성공률 | 국내 구장 사이트 약 60~70% (정적 HTML 기준) |
| 실패 케이스 | React/Vue SPA 기반 구장 사이트 (JS 렌더링 필요) |

### 4-2. 보조 경로: 텍스트 직접 붙여넣기 (JS 사이트 대응, 비용 0원)

URL 크롤링이 실패하거나 신뢰도 LOW인 경우, 앱이 다음 안내를 표시한다:

> "이 구장 페이지는 자동 추출이 어렵습니다.
> 브라우저에서 코스 표 내용을 선택 → 복사(Ctrl+C)한 뒤
> 아래 텍스트창에 붙여넣어 주세요."

관리자는 이미 해당 페이지를 보고 있으므로, 표를 드래그 선택 → 복사 → 붙여넣기로 10초 만에 해결된다.
Claude API는 HTML이 아닌 plain text도 동일하게 파싱할 수 있다.

**이 방식의 장점:**
- Browserless.io($49/월) 불필요
- 모든 구장 사이트 100% 대응 가능 (렌더링 방식 무관)
- 관리자의 추가 학습 비용 최소화

### 4-3. 장기: Seed DB 구축 (반복 등록 구장 대상)

자주 라운딩하는 구장 20~30개가 확정되면, 해당 구장 데이터를 한 번 수집 후 Supabase에 seed로 적재한다. 이후 동일 구장은 검색만으로 즉시 선택 가능.

---

## 5. 핵심 기술 구현 상세

### 5-1. AI 파싱 모델 선택 전략

**기본: Google Gemini Flash (무료)**
- Google AI Studio에서 API 키 발급 (무료, 카드 등록 불필요)
- 무료 한도: **1,500건/일** → 주 1~2개 구장 등록 기준 사실상 무제한
- 구조화 데이터 추출(표 파싱) 품질: 충분함

**fallback: Claude Haiku (유료, 선택)**
- Gemini 응답이 LOW 신뢰도일 때만 재시도
- 구장당 추가 비용 $0.001 미만

### 5-2. Supabase Edge Function: `course-import`

```typescript
// supabase/functions/course-import/index.ts

import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

interface ImportRequest {
  mode: 'url' | 'text';
  url?: string;    // mode="url" 시 필수
  text?: string;   // mode="text" 시 필수 (붙여넣은 텍스트)
}

const PROMPT_TEMPLATE = (content: string) => `
다음은 골프장 코스 소개 페이지의 내용입니다.
코스별 홀 정보를 추출하여 아래 JSON 형식으로만 반환하세요. 설명 없이 JSON만 출력하세요.

출력 형식:
{
  "clubName": "구장 전체명",
  "courses": [
    {
      "courseName": "A코스",
      "holes": [
        { "holeNumber": 1, "par": 4, "distanceMeter": 385, "distanceYard": 421 }
      ]
    }
  ],
  "confidence": "high"
}

규칙:
- par는 반드시 3, 4, 5 중 하나
- distanceMeter: 미터 단위. 야드만 있으면 ×0.9144 변환. 없으면 null
- distanceYard: 야드 단위. 없으면 null
- 여러 티(레드/화이트/블루)는 블루티(최장) 기준
- 확신 불가한 값은 null 처리 후 confidence를 "low"로 설정

내용:
${content}`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')        // 태그 제거 (텍스트만 남김)
    .replace(/\s{2,}/g, ' ')         // 연속 공백 정리
    .trim()
    .substring(0, 40000);            // 40KB 제한 (토큰 절약)
}

Deno.serve(async (req) => {
  const { mode, url, text }: ImportRequest = await req.json();

  let inputContent: string;

  if (mode === 'url') {
    const res = await fetch(url!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(10000)
    });
    const html = await res.text();
    inputContent = stripHtml(html);

    // 텍스트가 너무 적으면 JS 렌더링 필요 사이트로 판단
    if (inputContent.length < 300) {
      return new Response(JSON.stringify({
        error: 'JS_RENDER_REQUIRED',
        message: '이 구장 사이트는 자동 추출이 어렵습니다. 텍스트 붙여넣기 모드를 사용해 주세요.'
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    inputContent = text!.substring(0, 40000);
  }

  // Gemini Flash 호출 (무료)
  const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(PROMPT_TEMPLATE(inputContent));
  const responseText = result.response.text()
    .replace(/^```json\n?/, '').replace(/\n?```$/, ''); // 마크다운 코드블록 제거

  return new Response(responseText, {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**`stripHtml` 전처리의 효과**: HTML 태그를 모두 제거하고 텍스트만 남기므로 동일 내용 대비 토큰이 70~80% 절감된다. Gemini Flash 무료 한도(분당 100만 토큰)에서 전혀 문제없다.

### 5-2. 관리자 앱 UI 흐름

```
┌──────────────────────────────────────────────────┐
│  구장 정보 자동 불러오기                              │
│                                                  │
│  코스 소개 페이지 URL                               │
│  ┌────────────────────────────────────────────┐  │
│  │ https://www.clubname.co.kr/course/intro   │  │
│  └────────────────────────────────────────────┘  │
│  [불러오기]                                        │
│                                                  │
│  ── 실패 시 안내 (JS 렌더링 사이트) ─────────────  │
│  "브라우저에서 코스 표를 드래그 선택 후            │
│   Ctrl+C로 복사하여 아래에 붙여넣어 주세요"         │
│  ┌────────────────────────────────────────────┐  │
│  │ (붙여넣기 영역)                             │  │
│  └────────────────────────────────────────────┘  │
│  [텍스트로 불러오기]                               │
│                                                  │
│  ── 미리보기 ──────────────────────────────────  │
│  구장명: OO컨트리클럽       신뢰도: [● HIGH]       │
│  [A코스] [B코스] [C코스]                          │
│  A코스 (9홀) / Par 합계: 36 ✓                    │
│  ┌──────┬──────┬────────┬────────┐             │
│  │  홀  │  Par │  미터  │  야드  │             │
│  ├──────┼──────┼────────┼────────┤             │
│  │  1   │  [4] │  [385] │  [421] │ ← 직접 수정  │
│  └──────┴──────┴────────┴────────┘             │
│                                                  │
│  [전체 저장]   [다시 불러오기]   [취소]             │
└──────────────────────────────────────────────────┘
```

**UI 동작 규칙:**
- 신뢰도 HIGH: 즉시 저장 가능
- 신뢰도 MEDIUM: 노란색 경고 + "검토 후 저장" 안내
- 신뢰도 LOW: 저장 버튼 비활성화, 수동 수정 완료 시 활성화
- Par 합계 자동 계산 표시 (36/72 불일치 시 빨간색 경고)
- 전장 이상값 셀 주황색 하이라이트

---

## 6. 구현 단계 (Phase별 로드맵)

### Phase 1: MVP — URL 크롤링 + 텍스트 fallback (외부 API 없음)

**작업 항목:**
1. Supabase Edge Function `course-import` 생성 (5-1 코드 기준)
   - `mode: "url"` → 정적 HTML 크롤링 + Claude 파싱
   - `mode: "text"` → 붙여넣기 텍스트 + Claude 파싱
   - JS 렌더링 필요 사이트 감지 → 422 에러 + 안내 메시지
2. Admin 화면에 "자동 불러오기" 섹션 추가
   - URL 입력 + 불러오기 버튼
   - JS 렌더링 실패 시 텍스트 붙여넣기 영역 자동 노출
3. Preview 컴포넌트 구현 (수정 가능 테이블, Par 합계 실시간 계산, 신뢰도 배지)
4. 기존 `clubRepository.registerClub` 재사용하여 저장

**추가 비용**: 구장당 Claude API $0.01~0.02 (Haiku 사용 시 $0.001 수준으로 절감 가능)
**커버리지**: 정적 사이트 60~70% (자동) + 나머지 100% (텍스트 붙여넣기)

---

### Phase 2: 파싱 품질 안정화

**목표**: Gemini 응답이 LOW 신뢰도인 경우 대응

**방안:**
- LOW 신뢰도 응답 시 UI에서 "다시 시도" 버튼 노출
- 반복 실패 시 텍스트 붙여넣기 모드로 안내 (Claude fallback보다 이 쪽이 더 확실)
- 결과 캐싱: 동일 URL은 30일간 재추출 없이 로컬 저장값 반환 (API 호출 0회)

---

### Phase 3: Seed DB 구축 (반복 등록 구장 사전 적재)

**전제**: 자주 라운딩하는 구장 목록이 20~30개 확정된 시점

**작업 항목:**
1. 등록 대상 구장 리스트 확정 (관리자가 직접 선정)
2. Phase 1 도구로 일괄 수집 → 검토 → Supabase seed 적재
3. 앱 내 구장 선택 시 "이미 등록된 구장" 즉시 선택 UI 추가

---

### Phase 4: 코스 변경 감지 (장기)

**목표**: 등록된 구장의 Par 변경, 전장 조정 자동 감지

**작업 항목:**
1. Supabase Cron Job으로 월 1회 등록 구장 재크롤링
2. 기존 DB와 diff 비교 → 변경 항목 도출
3. 변경 감지 시 관리자 알림 발송 → 확인 후 적용

---

## 7. 기술 스택 및 비용 추정

| 구성 요소 | 기술 선택 | 예상 비용 |
|-----------|-----------|-----------|
| Edge Function 런타임 | Supabase Edge Functions (Deno) | 무료 |
| 정적 크롤링 | Deno 내장 fetch | 무료 |
| **AI 파싱 (기본)** | **Gemini 2.0 Flash (Google AI Studio)** | **무료 (1,500건/일)** |
| AI 파싱 (fallback) | Claude Haiku (선택, LOW 신뢰도 재시도용) | 구장당 $0.001 미만 |
| JS 사이트 대응 | 텍스트 붙여넣기 (관리자 직접) | 무료 |
| Cron Job | Supabase pg_cron | 무료 |

**월 예상 비용: $0** (Gemini 무료 한도 내에서 운영 가능)

---

## 8. 데이터 품질 보증 전략

### 저장 전 자동 검증 규칙 (기존 `registerClub` 로직 확장)

```
1. Par 합계 검증
   - 9홀 코스: 합계 = 36
   - 18홀 코스: 합계 = 72
   - 불일치 시 저장 차단 + 오류 메시지

2. 홀 번호 연속성 검증
   - 1번부터 N번까지 빠짐없이 연속

3. Par 범위 검증
   - 각 홀 Par는 3, 4, 5 중 하나

4. 전장 이상값 경고 (저장 차단은 아님)
   - Par 3:  80m ~ 230m
   - Par 4: 250m ~ 480m
   - Par 5: 430m ~ 600m
   - 범위 벗어날 경우 UI 주황색 경고 셀 표시
```

### 신뢰도 등급 기준

| 등급 | 조건 | UI 동작 |
|------|------|---------|
| HIGH | Par 합계 정확 + 전장 80% 이상 존재 + 코스명 명확 | 즉시 저장 허용 |
| MEDIUM | Par 합계 정확 + 전장 일부 누락 또는 코스명 불명확 | 경고 후 저장 허용 |
| LOW | Par 합계 오류 또는 홀 정보 대량 누락 | 저장 버튼 비활성화 |

---

## 9. 리스크 및 대응 방안

| 리스크 | 발생 가능성 | 대응 방안 |
|--------|------------|-----------|
| 구장 사이트 크롤링 차단 | 중간 | 실패 시 자동으로 텍스트 붙여넣기 모드 안내 |
| JS 렌더링 필요 SPA 사이트 | 높음 | 텍스트 붙여넣기 모드로 100% 대응 (무료) |
| AI 파싱 오류 (Par/전장 혼동) | 낮음 | 자동 검증 규칙 + 관리자 최종 검토 필수 |
| Claude API 응답 지연 | 낮음 | 10초 타임아웃 설정 + 재시도 UI |
| Claude API 비용 초과 | 매우 낮음 | Haiku 우선 사용, HTML 전처리로 토큰 절감 |

---

## 10. 환경변수 및 설정 목록 (구현 시 필요)

```bash
# Supabase Edge Function 환경변수
GOOGLE_AI_API_KEY=<YOUR_GOOGLE_AI_API_KEY>
      # Google AI Studio API 키 (무료 발급)
                               # 발급: https://aistudio.google.com/apikey

# 선택 (Gemini LOW 신뢰도 재시도용 — 없어도 동작)
ANTHROPIC_API_KEY=sk-ant-...   # Claude Haiku fallback용
```

**Google AI Studio API 키 발급 방법 (무료):**
1. https://aistudio.google.com/apikey 접속
2. Google 계정 로그인
3. "Create API key" 클릭 → 키 복사
4. 카드 등록 불필요, 즉시 발급

---

## 11. 관련 파일 경로 (구현 시 수정/생성 대상)

```
app/(tabs)/admin.tsx                         # "자동 불러오기" UI 섹션 추가
src/modules/golf/golf.repository.ts          # clubRepository.registerClub 재사용
supabase/functions/course-import/index.ts    # 신규 Edge Function (생성)
docs/supabase_schema.sql                     # 테이블 구조 참조
```

---

*최초 작성: 2026-03-05*
