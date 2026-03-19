-- ============================================================
-- [BUGFIX] enforce_round_constraints: upsert(UPDATE) 패스 예외 처리
-- 문제: BEFORE INSERT 트리거가 ON CONFLICT DO UPDATE 케이스에도 발동하여
--       과거 날짜 라운드의 동기화(upsert)를 차단하던 버그 수정
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_round_constraints()
RETURNS TRIGGER AS $$
DECLARE
    daily_count INT;
    is_upsert_update BOOLEAN;
BEGIN
    -- upsert로 인한 기존 레코드 업데이트 케이스 판별
    -- (BEFORE INSERT 트리거는 ON CONFLICT DO UPDATE에도 발동하므로 구분 필요)
    SELECT EXISTS (
        SELECT 1 FROM public.rounds WHERE id = NEW.id
    ) INTO is_upsert_update;

    -- 기존 레코드 업데이트(upsert)인 경우 비즈니스 제약 스킵
    IF is_upsert_update THEN
        RETURN NEW;
    END IF;

    -- [RULE 1.19] 과거 날짜의 기록 생성 원천 차단 (신규 INSERT에만 적용)
    IF (NEW.date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Past dates are not allowed for round creation (과거 날짜의 기록 생성은 불가능합니다).'
        USING ERRCODE = 'P0001';
    END IF;

    -- [RULE 1.19] 하루 최대 10건 라운드 생성 제한 (신규 INSERT에만 적용)
    SELECT COUNT(*) INTO daily_count
    FROM public.rounds
    WHERE user_id = auth.uid()
      AND date = NEW.date;

    IF (daily_count >= 10) THEN
        RAISE EXCEPTION 'Daily round limit reached (Max 10 per day: 하루 최대 라운드 생성 제한을 초과했습니다).'
        USING ERRCODE = 'P0002';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
