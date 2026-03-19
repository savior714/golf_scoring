import { useState, useCallback, useMemo } from 'react';
import { ClubInfo } from '@/src/modules/golf/domain/golf.types';
import { adminDomainService } from '../domain';
import { adminApplicationService } from '../application';

export function useBulkImport() {
    const [jsonText, setJsonText] = useState('');
    const [parsedData, setParsedData] = useState<ClubInfo[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isVerifiedByHuman, setIsVerifiedByHuman] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // JSON 파싱 핸들러
    const handleParse = useCallback(() => {
        setParseError(null);
        if (!jsonText.trim()) {
            setParseError('JSON 데이터를 입력해 주세요.');
            return;
        }

        try {
            const normalized = adminDomainService.normalizeJsonText(jsonText);
            const data = JSON.parse(normalized) as unknown;
            if (!Array.isArray(data)) {
                setParseError('데이터는 배열([]) 형태여야 합니다.');
                return;
            }
            const converted = adminDomainService.convertYardToMeter(data);
            // 변환된 데이터로 inputbox도 업데이트 (야드 → 미터 변환 결과 확인 가능)
            setJsonText(JSON.stringify(converted, null, 2));
            setParsedData(converted);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '알 수 없는 JSON 오류';
            setParseError(`JSON 문법 오류: ${msg}`);
        }
    }, [jsonText]);

    // 최종 등록 모달 열기
    const handleFinalSave = useCallback(() => {
        if (!parsedData || parsedData.length === 0) return;
        setSaveResult(null);
        setIsVerifiedByHuman(false);
        setIsConfirmVisible(true);
    }, [parsedData]);

    // 모달 확인 후 실제 DB 등록 실행
    const handleConfirmSave = useCallback(async () => {
        if (!parsedData || parsedData.length === 0) return;
        setIsConfirmVisible(false);
        setIsSaving(true);
        setSaveResult(null);
        try {
            const result = await adminApplicationService.registerClubsBulk(parsedData);
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
    }, [parsedData]);

    const handleClear = useCallback(() => {
        setJsonText('');
        setParsedData(null);
        setParseError(null);
        setSaveResult(null);
    }, []);

    return useMemo(() => ({
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
    }), [
        jsonText,
        parsedData,
        parseError,
        isSaving,
        isConfirmVisible,
        isVerifiedByHuman,
        saveResult,
        handleParse,
        handleFinalSave,
        handleConfirmSave,
        handleClear
    ]);
}


