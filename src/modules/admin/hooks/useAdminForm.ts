import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { clubRepository } from '@/src/modules/golf/golf.repository';
import { golfService } from '@/src/modules/golf/golf.service';
import { ClubSummary } from '@/src/modules/golf/golf.types';
import { CourseInput, TeeColorKey, TEE_COLORS } from '@/src/modules/admin/components/AdminFormComponents';

const DEFAULT_HOLES = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ holeNumber: i + 1, par: '4', distances: {} }));

function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
    } else {
        Alert.alert(title, message);
    }
}

export function useAdminForm() {
    const [clubName, setClubName] = useState('');
    const [courses, setCourses] = useState<CourseInput[]>([
        { courseName: '', holes: DEFAULT_HOLES(9), activeTees: ['White'] },
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [clubList, setClubList] = useState<ClubSummary[]>([]);
    const [showClubSelect, setShowClubSelect] = useState(false);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);
    const isMounted = useRef(true);
    const stateRef = useRef({ clubName, courses });

    useEffect(() => {
        stateRef.current = { clubName, courses };
    }, [clubName, courses]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadClubList = useCallback(async () => {
        setIsLoadingClubs(true);
        try {
            const list = await clubRepository.getAllClubsSummary();
            if (isMounted.current) setClubList(list);
        } finally {
            if (isMounted.current) setIsLoadingClubs(false);
        }
    }, []);

    const handleSelectClub = useCallback(async (clubId: string) => {
        setIsLoadingClubs(true);
        setShowClubSelect(false);
        try {
            const fullInfo = await clubRepository.getClubFullInfo(clubId);
            if (fullInfo && isMounted.current) {
                setClubName(fullInfo.name);
                setIsSubmitted(false);
                setCourses(fullInfo.courses.map(c => {
                    const teesInData = [...new Set(
                        c.holes.flatMap(h => h.distances.map(d => d.teeColor))
                    )] as TeeColorKey[];
                    const activeTees: TeeColorKey[] = teesInData.length > 0
                        ? TEE_COLORS.filter(t => teesInData.includes(t.key)).map(t => t.key)
                        : ['White'];
                    return {
                        id: c.id,
                        courseName: c.name,
                        activeTees,
                        holes: c.holes.map(h => ({
                            holeNumber: h.holeNumber,
                            par: String(h.par),
                            distances: Object.fromEntries(
                                h.distances.map(d => [d.teeColor, String(d.distanceMeter)])
                            ) as Partial<Record<TeeColorKey, string>>,
                        })),
                    };
                }));
            }
        } catch {
            if (isMounted.current) showAlert('오류', '구장 정보를 불러오지 못했습니다.');
        } finally {
            if (isMounted.current) setIsLoadingClubs(false);
        }
    }, []);

    const addCourse = useCallback(() => {
        setCourses(prev => [...prev, { courseName: '', holes: DEFAULT_HOLES(9), activeTees: ['White'] }]);
    }, []);

    const removeCourse = useCallback(async (idx: number) => {
        const { courses: currentCourses } = stateRef.current;
        if (currentCourses.length <= 1) return;

        const target = currentCourses[idx];
        if (!target.id) {
            setCourses(prev => prev.filter((_, i) => i !== idx));
            return;
        }

        const confirmed = await new Promise<boolean>(resolve => {
            if (Platform.OS === 'web') {
                resolve(window.confirm(`"${target.courseName}" 코스를 영구 삭제하시겠습니까?`));
            } else {
                Alert.alert(
                    '코스 삭제 확인',
                    `"${target.courseName}" 코스를 영구 삭제하시겠습니까?`,
                    [
                        { text: '취소', onPress: () => resolve(false), style: 'cancel' },
                        { text: '삭제', onPress: () => resolve(true), style: 'destructive' },
                    ]
                );
            }
        });

        if (!confirmed) return;

        const result = await clubRepository.deleteGolfCourse(target.id);
        if (!result.success) {
            showAlert('삭제 실패', result.error?.message ?? '코스 삭제 중 오류가 발생했습니다.');
            return;
        }
        setCourses(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const updateCourseName = useCallback((idx: number, name: string) => {
        setCourses(prev => prev.map((c, i) => i === idx ? { ...c, courseName: name } : c));
    }, []);

    const toggleTee = useCallback((courseIdx: number, teeKey: TeeColorKey) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const already = c.activeTees.includes(teeKey);
            if (already && c.activeTees.length <= 1) return c;
            const newTees = already
                ? c.activeTees.filter(t => t !== teeKey)
                : [...c.activeTees, teeKey];
            return { ...c, activeTees: newTees };
        }));
    }, []);

    const updatePar = useCallback((courseIdx: number, holeIdx: number, value: string) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const newHoles = c.holes.map((h, hi) =>
                hi === holeIdx ? { ...h, par: value } : h
            );
            return { ...c, holes: newHoles };
        }));
    }, []);

    const updateTeeDistance = useCallback(
        (courseIdx: number, holeIdx: number, teeKey: TeeColorKey, value: string) => {
            setCourses(prev => prev.map((c, ci) => {
                if (ci !== courseIdx) return c;
                const newHoles = c.holes.map((h, hi) => {
                    if (hi !== holeIdx) return h;
                    return { ...h, distances: { ...h.distances, [teeKey]: value } };
                });
                return { ...c, holes: newHoles };
            }));
        },
        []
    );

    const buildValidationPayload = useCallback(() => {
        const { clubName: cName, courses: cCourses } = stateRef.current;
        return {
            name: cName,
            courses: cCourses.map(c => ({
                name: c.courseName,
                holes: c.holes.map(h => ({
                    holeNumber: h.holeNumber,
                    par: parseInt(h.par, 10) || 0,
                    distances: Object.entries(h.distances)
                        .filter(([, v]) => v !== '' && !isNaN(parseInt(v ?? '', 10)))
                        .map(([teeColor, distanceMeter]) => ({
                            teeColor,
                            distanceMeter: parseInt(distanceMeter ?? '', 10),
                        })),
                })),
            })),
        };
    }, []);

    const handleSave = useCallback(async () => {
        setIsSubmitted(true);
        const { clubName: cName, courses: cCourses } = stateRef.current;
        if (!cName.trim()) {
            showAlert('입력 오류', '구장명을 입력해 주세요.');
            return;
        }

        const payloadSummary = buildValidationPayload();
        const validation = golfService.validateClubData(payloadSummary);

        if (!validation.isValid) {
            let confirmSave: boolean;
            if (Platform.OS === 'web') {
                confirmSave = window.confirm(
                    `데이터 무결성 주의\n입력된 정보에 ${validation.issues.length}건의 주의사항이 있습니다.\n이대로 저장하시겠습니까?`
                );
            } else {
                confirmSave = await new Promise<boolean>(resolve => {
                    Alert.alert(
                        '데이터 무결성 주의',
                        `입력된 정보에 ${validation.issues.length}건의 주의사항이 있습니다.\n이대로 저장하시겠습니까?`,
                        [
                            { text: '취소', onPress: () => resolve(false), style: 'cancel' },
                            { text: '저장 진행', onPress: () => resolve(true) },
                        ]
                    );
                });
            }
            if (!confirmSave) return;
        }

        for (const course of cCourses) {
            if (!course.courseName.trim()) {
                showAlert('입력 오류', '모든 코스명을 입력해 주세요.');
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload = {
                clubName: cName.trim(),
                isVerified: validation.isValid,
                courses: cCourses.map(c => ({
                    courseName: c.courseName.trim(),
                    holes: c.holes.map(h => ({
                        holeNumber: h.holeNumber,
                        par: parseInt(h.par, 10) || 4,
                        distances: Object.entries(h.distances)
                            .filter(([, v]) => v !== '' && !isNaN(parseInt(v, 10)))
                            .map(([teeColor, distanceMeter]) => ({
                                teeColor,
                                distanceMeter: parseInt(distanceMeter, 10),
                            })),
                    })),
                })),
            };

            const result = await clubRepository.registerClub(payload);
            if (isMounted.current) {
                if (result.success) {
                    showAlert('등록/수정 완료', `"${cName}" 구장이 저장되었습니다.`);
                    setIsSubmitted(false);
                } else {
                    showAlert('저장 실패', result.error?.message ?? '오류가 발생했습니다.');
                }
            }
        } catch {
            if (isMounted.current) showAlert('오류', '저장 중 오류가 발생했습니다.');
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    }, [buildValidationPayload]);

    const validationStatus = useMemo(
        () => golfService.validateClubData(buildValidationPayload()),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [clubName, courses, buildValidationPayload]
    );

    return {
        clubName,
        setClubName,
        courses,
        isSaving,
        isSubmitted,
        clubList,
        showClubSelect,
        setShowClubSelect,
        isLoadingClubs,
        validationStatus,
        loadClubList,
        handleSelectClub,
        addCourse,
        removeCourse,
        updateCourseName,
        toggleTee,
        updatePar,
        updateTeeDistance,
        handleSave,
    };
}
