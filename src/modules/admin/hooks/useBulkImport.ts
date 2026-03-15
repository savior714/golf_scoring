import { useState } from 'react';
import { clubRepository } from '../../golf/golf.repository';
import { ClubInfo } from '../../golf/golf.types';

export function useBulkImport() {
    const [jsonText, setJsonText] = useState('');
    const [parsedData, setParsedData] = useState<ClubInfo[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isVerifiedByHuman, setIsVerifiedByHuman] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 스마트 쿼트·이상 공백 등을 표준 ASCII로 정규화 (웹 붙여넣기 오염 방지)
    const normalizeJsonText = (raw: string): string =>
        raw
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // 좌우 이중 따옴표 계열
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // 좌우 단일 따옴표 계열
            .replace(/\u00A0/g, ' ')  // non-breaking space → 일반 공백
            .replace(/\uFEFF/g, '');  // BOM 제거

    // distanceYard → distanceMeter 자동 변환 (1야드 = 0.9144m)
    // distanceMeter가 이미 있으면 변환하지 않음
    const convertYardToMeter = (data: unknown[]): ClubInfo[] =>
        (data as any[]).map((club) => ({
            ...club,
            courses: club.courses?.map((course: any) => ({
                ...course,
                holes: course.holes?.map((hole: any) => ({
                    ...hole,
                    distances: hole.distances?.map((d: any) => {
                        if (d.distanceYard !== undefined && d.distanceMeter === undefined) {
                            return { teeColor: d.teeColor, distanceMeter: Math.round(d.distanceYard * 0.9144) };
                        }
                        return d;
                    }),
                })),
            })),
        }));

    // JSON 파싱 핸들러
    const handleParse = () => {
        setParseError(null);
        if (!jsonText.trim()) {
            setParseError('JSON 데이터를 입력해 주세요.');
            return;
        }

        try {
            const normalized = normalizeJsonText(jsonText);
            const data = JSON.parse(normalized) as unknown;
            if (!Array.isArray(data)) {
                setParseError('데이터는 배열([]) 형태여야 합니다.');
                return;
            }
            const converted = convertYardToMeter(data);
            // 변환된 데이터로 inputbox도 업데이트 (야드 → 미터 변환 결과 확인 가능)
            setJsonText(JSON.stringify(converted, null, 2));
            setParsedData(converted);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '알 수 없는 JSON 오류';
            setParseError(`JSON 문법 오류: ${msg}`);
        }
    };

    // 최종 등록 모달 열기
    const handleFinalSave = () => {
        if (!parsedData || parsedData.length === 0) return;
        setSaveResult(null);
        setIsVerifiedByHuman(false);
        setIsConfirmVisible(true);
    };

    // 모달 확인 후 실제 DB 등록 실행
    const handleConfirmSave = async () => {
        if (!parsedData || parsedData.length === 0) return;
        setIsConfirmVisible(false);
        setIsSaving(true);
        setSaveResult(null);
        try {
            const result = await clubRepository.registerClubsBulk(parsedData);
            if (result.success) {
                setSaveResult({ type: 'success', message: `${result.count}개의 구장이 성공적으로 등록되었습니다.` });
                setParsedData(null);
                setJsonText('');
            } else {
                setSaveResult({ type: 'error', message: result.error?.message || '알 수 없는 오류가 발생했습니다.' });
            }
        } catch (e: unknown) {
            setSaveResult({ type: 'error', message: e instanceof Error ? e.message : '데이터 적재 중 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        setJsonText('');
        setParsedData(null);
        setParseError(null);
        setSaveResult(null);
    };

    return {
        jsonText,
        setJsonText,
        parsedData,
        setParsedData,
        parseError,
        setParseError,
        isSaving,
        setIsSaving,
        isConfirmVisible,
        setIsConfirmVisible,
        isVerifiedByHuman,
        setIsVerifiedByHuman,
        saveResult,
        setSaveResult,
        handleParse,
        handleFinalSave,
        handleConfirmSave,
        handleClear
    };
}
