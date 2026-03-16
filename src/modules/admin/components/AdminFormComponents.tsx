/**
 * @file src/modules/admin/components/AdminFormComponents.tsx
 * @description 관리자 화면의 대형 폼 구성을 분리한 컴포넌트군
 */

import { memo, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../adminForm.styles';
import Trash2 from 'lucide-react-native/dist/icons/trash-2';
import { golfService } from '@/src/modules/golf/golf.service';

// ────────────────────────────────────────────────────────────
// 티 색상 및 타입
// ────────────────────────────────────────────────────────────
export const TEE_COLORS = [
    { key: 'Black', label: '블랙', color: '#212529' },
    { key: 'Blue', label: '블루', color: '#007AFF' },
    { key: 'White', label: '화이트', color: '#495057' },
    { key: 'Red', label: '레드', color: '#FF6B6B' },
] as const;

export type TeeColorKey = typeof TEE_COLORS[number]['key'];

export interface HoleInput {
    holeNumber: number;
    par: string;
    distances: Partial<Record<TeeColorKey, string>>;
}

export interface CourseInput {
    id?: string;
    courseName: string;
    holes: HoleInput[];
    activeTees: TeeColorKey[];
}

// ────────────────────────────────────────────────────────────
// 1. Par 합계 미리보기 (Memoized)
// ────────────────────────────────────────────────────────────
export const ParSumPreview = memo(({ holes }: { holes: HoleInput[] }) => {
    const sum = holes.reduce((acc, h) => acc + (parseInt(h.par, 10) || 0), 0);
    const expected = holes.length === 9 ? 36 : 72;
    const isValid = sum === expected;

    return (
        <View style={[styles.parSumBadge, isValid ? styles.parSumOk : styles.parSumWarn]}>
            <Text style={[styles.parSumText, isValid ? styles.parSumTextOk : styles.parSumTextWarn]}>
                Par 합계: {sum} / {expected} {isValid ? '(정상)' : '(오류 — 입력 확인 필요)'}
            </Text>
        </View>
    );
});

// ────────────────────────────────────────────────────────────
// 2. 홀 입력 로우 (Memoized)
// ────────────────────────────────────────────────────────────
interface HoleRowProps {
    hole: HoleInput;
    activeTees: TeeColorKey[];
    onUpdatePar: (holeIdx: number, value: string) => void;
    onUpdateDistance: (holeIdx: number, teeKey: TeeColorKey, value: string) => void;
    holeIdx: number;
}

export const HoleRow = memo(({ hole, activeTees, onUpdatePar, onUpdateDistance, holeIdx }: HoleRowProps) => {
    return (
        <View style={styles.holeInputRow}>
            <View style={styles.holeNumberBadge}>
                <Text style={styles.holeNumberText}>{hole.holeNumber}</Text>
            </View>
            <TextInput
                style={styles.parInputSmall}
                keyboardType="number-pad"
                maxLength={1}
                value={hole.par}
                onChangeText={v => onUpdatePar(holeIdx, v)}
                selectTextOnFocus
            />
            {activeTees.map(teeKey => (
                <TextInput
                    key={teeKey}
                    style={styles.distanceInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#ced4da"
                    value={hole.distances[teeKey] ?? ''}
                    onChangeText={v => onUpdateDistance(holeIdx, teeKey, v)}
                    selectTextOnFocus
                />
            ))}
        </View>
    );
});

// ────────────────────────────────────────────────────────────
// 3. 코스 섹션 (Memoized)
// ────────────────────────────────────────────────────────────
interface CourseSectionProps {
    course: CourseInput;
    courseIdx: number;
    onRemove: (idx: number) => void;
    onUpdateName: (idx: number, name: string) => void;
    onToggleTee: (courseIdx: number, teeKey: TeeColorKey) => void;
    onUpdatePar: (courseIdx: number, holeIdx: number, value: string) => void;
    onUpdateDistance: (courseIdx: number, holeIdx: number, teeKey: TeeColorKey, value: string) => void;
    canRemove: boolean;
    forceShowErrors?: boolean;
}

export const CourseSection = memo(({
    course,
    courseIdx,
    onRemove,
    onUpdateName,
    onToggleTee,
    onUpdatePar,
    onUpdateDistance,
    canRemove,
    forceShowErrors = false,
}: CourseSectionProps) => {
    // Validation payload for this course
    const clubStubForValidation = {
        name: 'Stub',
        courses: [{
            name: course.courseName,
            holes: course.holes.map(h => ({
                holeNumber: h.holeNumber,
                par: parseInt(h.par, 10) || 0,
                distances: Object.entries(h.distances)
                    .filter(([, v]) => v !== '' && !isNaN(parseInt(v ?? '', 10)))
                    .map(([teeColor, distanceMeter]) => ({
                        teeColor,
                        distanceMeter: parseInt(distanceMeter ?? '', 10),
                    })),
            })),
        }]
    };

    const { isValid, issues } = golfService.validateClubData(clubStubForValidation);

    // Pristine 상태 판별 (Task 1): 신규 코스이면서 수동 입력이 전혀 없는 상태
    const isPristine = useMemo(() => {
        if (course.id) return false;
        if (course.courseName.trim() !== '') return false;
        
        // DEFAULT_HOLES의 파가 '4'이고 거리가 {}인 점을 고려
        return course.holes.every(h => 
            (h.par === '4' || h.par === '') && 
            Object.values(h.distances).every(d => !d || d === '')
        );
    }, [course]);

    // 경고 노출 여부 (Task 2): 유효하지 않고(issues가 있고) AND (Pristine이 아니거나 강제 노출 모드일 때)
    const shouldShowIssues = !isValid && issues.length > 0 && (!isPristine || forceShowErrors);

    return (
        <View style={styles.card}>
            {/* 코스 헤더 */}
            <View style={styles.courseHeader}>
                <Text style={styles.label}>코스 {courseIdx + 1}</Text>
                {canRemove && (
                    <TouchableOpacity onPress={() => onRemove(courseIdx)} style={styles.removeBtn}>
                        <Trash2 size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                )}
            </View>
            <TextInput
                style={[styles.input, { marginBottom: 16 }]}
                placeholder="예: Lake Course"
                placeholderTextColor="#adb5bd"
                value={course.courseName}
                onChangeText={v => onUpdateName(courseIdx, v)}
                blurOnSubmit={false}
            />

            {/* 개별 코스 이슈 표시 */}
            {shouldShowIssues && (
                <View style={styles.issuesCard}>
                    <Text style={styles.issuesTitle}>⚠️ 코스 데이터 주의 ({issues.length}건)</Text>
                    {issues.map((issue, i) => (
                        <Text key={i} style={styles.issueItem}>• {issue}</Text>
                    ))}
                </View>
            )}

            <ParSumPreview holes={course.holes} />

            {/* 티 선택 토글 */}
            <View style={styles.teeToggleRow}>
                <Text style={styles.teeToggleLabel}>입력 티:</Text>
                {TEE_COLORS.map(tee => {
                    const active = course.activeTees.includes(tee.key);
                    return (
                        <TouchableOpacity
                            key={tee.key}
                            style={[
                                styles.teeToggleBtn,
                                active && { backgroundColor: tee.color, borderColor: tee.color },
                            ]}
                            onPress={() => onToggleTee(courseIdx, tee.key)}
                        >
                            <Text style={[styles.teeToggleBtnText, active && { color: '#fff' }]}>
                                {tee.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* 홀별 입력 그리드 */}
            <View style={styles.parGrid}>
                <View style={styles.gridHeader}>
                    <Text style={[styles.gridHeaderText, { width: 30 }]}>홀</Text>
                    <Text style={[styles.gridHeaderText, { width: 46 }]}>PAR</Text>
                    {course.activeTees.map(teeKey => {
                        const tee = TEE_COLORS.find(t => t.key === teeKey);
                        if (!tee) return null;
                        return (
                            <Text
                                key={teeKey}
                                style={[styles.gridHeaderText, styles.gridHeaderTee, { color: tee.color }]}
                            >
                                {tee.label}(m)
                            </Text>
                        );
                    })}
                </View>
                {course.holes.map((hole, hi) => (
                    <HoleRow
                        key={hi}
                        hole={hole}
                        holeIdx={hi}
                        activeTees={course.activeTees}
                        onUpdatePar={(hIdx, val) => onUpdatePar(courseIdx, hIdx, val)}
                        onUpdateDistance={(hIdx, tKey, val) => onUpdateDistance(courseIdx, hIdx, tKey, val)}
                    />
                ))}
            </View>
        </View>
    );
});

