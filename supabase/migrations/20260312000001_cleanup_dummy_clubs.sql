-- [2026-03-12] Cleanup dummy/test golf courses
-- 관리자 화면에서 새로 등록하기 위해 기존의 테스트용 더미 데이터를 정리합니다.

-- 1. "테스트"가 이름에 포함된 모든 구장 삭제
DELETE FROM public.golf_clubs
WHERE name ILIKE '%테스트%';

-- 2. 미검증 구장 삭제 (위 쿼리로 이미 대부분 처리되겠지만 안전을 위해 수행)
DELETE FROM public.golf_clubs
WHERE is_verified = false;

-- 참고: golf_clubs가 삭제되면 ON DELETE CASCADE 설정으로 인해 
-- 연관된 golf_courses, golf_holes, hole_distances도 자동으로 삭제됩니다.
