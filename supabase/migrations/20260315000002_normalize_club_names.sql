-- 기존 DB에 저장된 비정규화 구장명을 일괄 정규화
-- JS normalizeClubName() 동작 재현: 접미사 제거 후 CC 접미
--
-- 처리 순서:
--   1. 알려진 접미사(골프앤리조트, 컨트리클럽, CC, GC 등) 제거
--   2. 공백 trim
--   3. 'CC' 접미
--   4. 결과가 빈 문자열이면 원본 유지 (안전 가드)
--   5. 이미 CC로 끝나는 레코드는 제외

UPDATE public.golf_clubs
SET name = CASE
    WHEN trim(regexp_replace(
        name,
        '(골프앤리조트|골프앤드리조트|컨트리클럽|컨트리 클럽|골프클럽|골프 클럽|골프장|CC|GC|G\.C|C\.C)\s*$',
        '', 'gi'
    )) = '' THEN name
    ELSE trim(regexp_replace(
        name,
        '(골프앤리조트|골프앤드리조트|컨트리클럽|컨트리 클럽|골프클럽|골프 클럽|골프장|CC|GC|G\.C|C\.C)\s*$',
        '', 'gi'
    )) || 'CC'
END
WHERE name !~ 'CC$';
