# 🗺️ Project Blueprint: 상태 관리 버튼 웹 호환성 수정

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **웹 환경에서 `Alert.alert()` 무반응 버그 수정**
- `golfscoring.vercel.app`은 웹 빌드(Expo Web)로, React Native Web의 `Alert.alert()`은
  4개 이상의 버튼을 가진 멀티버튼 다이얼로그를 지원하지 않아 **완전 무반응**으로 나타남
- 해결책: 크로스플랫폼 호환 `Modal` 컴포넌트로 교체 (네이티브/웹 모두 동작)
- **SSOT**: `docs/CRITICAL_LOGIC.md`와 충돌 없음 (UI 레이어 변경만 포함)

---

## 🔍 Root Cause 분석

| 구분 | 내용 |
|---|---|
| **문제 파일** | `app/admin_requests.tsx` L76–L101 |
| **원인 API** | `Alert.alert()` — React Native 네이티브 전용 |
| **웹 동작** | 버튼 4개 시나리오: 매핑 불가 → 무반응 |
| **영향 범위** | `상태 관리 >` 버튼 클릭 시 아무것도 표시되지 않음 |

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: `adminRequests.styles.ts`에 모달 스타일 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/admin/styles/adminRequests.styles.ts`
  - **Goal**: 커스텀 모달 표시에 필요한 스타일 정의 (overlay, sheet, actionItem 등)
  - **Dependency**: None
  - **Pseudocode**:
    ```ts
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
    modalTitle: { fontSize: 15, fontWeight: '700', color: '#0A2647', marginBottom: 4 },
    modalActionBtn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center' },
    modalActionText: { fontSize: 15, fontWeight: '700', color: '#0A2647' },
    modalDestructiveText: { color: '#991B1B' },
    modalCancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: '#adb5bd' },
    ```

- [ ] **Task 2: `admin_requests.tsx`에서 `Alert.alert` → 커스텀 `Modal`로 교체**
  - **Tool**: `Edit`
  - **Target**: `app/admin_requests.tsx`
  - **Goal**: `handleUpdateStatus`를 모달 오픈으로 변경, 화면 하단에 `Modal` JSX 추가
  - **Dependency**: Task 1
  - **변경 요약**:
    1. `import { Modal } from 'react-native'` 추가
    2. `useState<string | null>(null)` → `selectedId` 상태 추가
    3. `handleUpdateStatus(id)` → `setSelectedId(id)` 로 교체 (Alert 제거)
    4. 실제 업데이트 로직은 `handleConfirmStatus(status)` 함수로 분리
    5. `return` JSX 최하단에 `<Modal>` 바텀시트 추가

- [ ] **Task 3: 타입 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | tail -20`
  - **Goal**: 타입 에러 Zero 확인
  - **Dependency**: Task 2

---

## 📐 구현 상세 설계 (Task 2 의사코드)

```tsx
// 추가할 state
const [selectedId, setSelectedId] = useState<string | null>(null);

// handleUpdateStatus 교체
const handleUpdateStatus = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// 새 핸들러 추가
const handleConfirmStatus = useCallback(async (status: CourseRequest['status']) => {
  if (!selectedId) return;
  setSelectedId(null);
  const success = await adminRepository.updateRequestStatus(selectedId, status);
  if (success && isMounted.current) loadRequests();
}, [selectedId, loadRequests]);

// JSX: return 최하단에 추가 (FlatList 다음)
<Modal
  visible={selectedId !== null}
  transparent
  animationType="slide"
  onRequestClose={() => setSelectedId(null)}
>
  <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedId(null)}>
    <View style={styles.modalSheet}>
      <Text style={styles.modalTitle}>상태 변경</Text>
      <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleConfirmStatus('completed')}>
        <Text style={styles.modalActionText}>✅ 완료 처리</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleConfirmStatus('rejected')}>
        <Text style={[styles.modalActionText, styles.modalDestructiveText]}>❌ 반려</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleConfirmStatus('pending')}>
        <Text style={styles.modalActionText}>🔄 대기로 복구</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedId(null)}>
        <Text style={styles.modalCancelText}>취소</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
```

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정
- **Cross-platform**: `Modal`은 `react-native` 기본 컴포넌트 — 추가 패키지 설치 불필요
- **TouchableOpacity on overlay**: 배경 탭 시 모달 닫힘 처리 포함해야 함
- **`activeOpacity` 주의**: overlay의 `TouchableOpacity` 내부 `View`는 `onPress` 이벤트 버블링 차단 필요
  - `<View onStartShouldSetResponder={() => true}>` 또는 별도 처리

## ✅ Definition of Done

1. [ ] 웹(`golfscoring.vercel.app`)에서 "상태 관리 >" 클릭 시 바텀시트 모달 표시
2. [ ] 각 버튼 탭 시 DB 업데이트 후 목록 새로고침
3. [ ] 네이티브 앱에서도 동일하게 동작
4. [ ] `npx tsc --noEmit` 에러 Zero
