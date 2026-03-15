# 🗺️ Project Blueprint: 상태 관리 모달 단순화 및 이메일 알림 발송

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

1. **모달 단순화**: 현재 `admin_requests.tsx`의 상태 변경 모달에서 "대기로 복구" 버튼 제거 → **완료 / 반려** 두 가지만 유지
2. **이메일 알림**: 완료 또는 반려 처리 시 요청자 이메일 주소(`profiles.email`)로 결과 통보
   - 이메일 발송은 Supabase Edge Function(`notify-request-status`)이 담당
   - **Resend API** 사용 (무료 tier: 100 emails/day, API Key 환경변수 설정 필요)

- **SSOT**: `docs/CRITICAL_LOGIC.md` §11 Admin Realtime & UI Standards 정렬 확인

---

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

> ⚠️ **각 Task는 단 하나의 도구 호출(Read / Edit / Write / Bash 중 1개)로 완료되어야 한다.**

---

- [ ] **Task 1: `admin_requests.tsx` 읽기 — 현재 모달 구조 파악**
  - **Tool**: `Read`
  - **Target**: `app/admin_requests.tsx`
  - **Goal**: 상태 변경 모달 렌더링 블록 및 `handleConfirmStatus` 호출 구조 확인
  - **Dependency**: None

---

- [ ] **Task 2: `admin_requests.tsx` 수정 — "대기로 복구" 버튼 제거**
  - **Tool**: `Edit`
  - **Target**: `app/admin_requests.tsx`
  - **Goal**: 모달에서 `pending` 상태 복구 버튼 제거, 완료/반려 두 버튼만 유지
  - **Pseudocode**:
    ```tsx
    // 삭제 대상: "대기로 복구" TouchableOpacity 블록 전체
    // 유지: "완료 처리" → status: 'approved'
    // 유지: "반려" → status: 'rejected'
    ```
  - **Dependency**: Task 1

---

- [ ] **Task 3: `supabase/functions/notify-request-status/index.ts` 생성 — 이메일 발송 Edge Function**
  - **Tool**: `Write`
  - **Target**: `supabase/functions/notify-request-status/index.ts`
  - **Goal**: 상태 변경 시 Resend API로 요청자 이메일 발송
  - **환경변수 (Supabase Secrets)**:
    - `RESEND_API_KEY` — Resend 대시보드에서 발급 (https://resend.com)
    - `FROM_EMAIL` — 발신 주소 (예: `noreply@golfscoring.vercel.app`)
  - **Pseudocode**:
    ```typescript
    // POST { requestId, status, courseName, toEmail }
    // status === 'approved' → 제목: "구장 추가 요청이 승인되었습니다"
    // status === 'rejected' → 제목: "구장 추가 요청이 반려되었습니다"
    // Resend API: POST https://api.resend.com/emails
    // 응답: HTTP 200 + { success: true } or { error: string }
    ```
  - **Dependency**: None (독립 작업)

---

- [ ] **Task 4: `admin.repository.ts` 읽기 — updateRequestStatus 함수 확인**
  - **Tool**: `Read`
  - **Target**: `src/modules/admin/admin.repository.ts`
  - **Goal**: 현재 `updateRequestStatus` 서명과 반환 타입, Edge Function 호출 추가 위치 확인
  - **Dependency**: None (독립 작업)

---

- [ ] **Task 5: `admin.repository.ts` 수정 — 상태 변경 후 Edge Function 호출 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/admin/admin.repository.ts`
  - **Goal**: `updateRequestStatus` 성공 후 `notify-request-status` Edge Function invoke 추가
  - **Pseudocode**:
    ```typescript
    // DB 업데이트 성공 시:
    await supabase.functions.invoke('notify-request-status', {
      body: { requestId: id, status, courseName, toEmail }
    });
    // invoke 실패는 로그만 기록, throw하지 않음 (이메일 실패가 상태 변경을 롤백하면 안 됨)
    ```
  - **중요**: `courseName`, `toEmail`은 호출자(hook)에서 전달받도록 파라미터 확장
  - **Dependency**: Task 4

---

- [ ] **Task 6: `admin_requests.tsx` 수정 — handleConfirmStatus에 courseName/email 전달**
  - **Tool**: `Edit`
  - **Target**: `app/admin_requests.tsx`
  - **Goal**: Task 5에서 확장된 `updateRequestStatus` 파라미터에 맞게 호출부 수정
  - **Pseudocode**:
    ```typescript
    // selectedRequest = requests.find(r => r.id === selectedId)
    // handleConfirmStatus(status, selectedRequest.course_name, selectedRequest.profiles.email)
    ```
  - **Dependency**: Task 2, Task 5

---

- [ ] **Task 7: Edge Function 배포**
  - **Tool**: `Bash`
  - **Command**: `npx supabase functions deploy notify-request-status --project-ref eqzobqeotfxvsllforew 2>&1 | Select-Object -Last 20`
  - **Goal**: 배포 완료 확인
  - **사전 조건**: Resend API Key를 Supabase Secrets에 등록 필요
    ```bash
    npx supabase secrets set RESEND_API_KEY=<your_key> FROM_EMAIL=<from_address> --project-ref eqzobqeotfxvsllforew
    ```
  - **Dependency**: Task 3

---

## ⚠️ 기술적 제약 및 규칙

| 항목 | 내용 |
|------|------|
| **이메일 서비스** | Resend API (https://resend.com) — 무료 100건/일, API Key 필요 |
| **Edge Function 에러 정책** | 이메일 발송 실패 시 DB 롤백 없음. `data?.error` 로그만 기록 |
| **응답 형식** | Edge Function은 항상 HTTP 200, `{ success }` 또는 `{ error }` 반환 |
| **Encoding** | UTF-8 no BOM 고정 |
| **파일 라인 수** | `admin_requests.tsx` 248줄 — 300 미만, 리팩토링 선행 불필요 |
| **보안** | `RESEND_API_KEY`는 Supabase Secrets로만 관리, 코드에 하드코딩 금지 |

---

## ✅ Definition of Done

1. [ ] 상태 관리 모달에 완료/반려 두 버튼만 노출됨
2. [ ] 완료/반려 처리 시 요청자 이메일로 알림 메일 발송됨
3. [ ] 이메일 발송 실패가 상태 변경 성공에 영향을 미치지 않음
4. [ ] `memory.md` 업데이트 완료

---

## 📋 실행 순서 요약

```
Task 1 (Read admin_requests.tsx)
    └─ Task 2 (모달 단순화)
           └─ Task 6 (파라미터 전달 수정)

Task 3 (Edge Function 작성)        ← Task 2와 병렬 가능
    └─ Task 7 (배포)

Task 4 (Read admin.repository.ts)
    └─ Task 5 (updateRequestStatus 확장)
           └─ Task 6 (파라미터 전달 수정)
```
