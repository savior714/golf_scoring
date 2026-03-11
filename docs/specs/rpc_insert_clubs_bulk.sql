-- [Task 3] Atomic Bulk Insertion (insert_clubs_bulk)
-- 구장, 코스, 홀, 전장 정보를 하나의 트랜잭션으로 처리하는 RPC 함수

CREATE OR REPLACE FUNCTION public.insert_clubs_bulk(p_clubs_json JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_club_record JSONB;
    v_course_record JSONB;
    v_hole_record JSONB;
    v_dist_record JSONB;
    v_club_id UUID;
    v_course_id UUID;
    v_hole_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- 권한 체크 (Admin만 가능)
    -- IF NOT is_admin() THEN
    --     RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    -- END IF;

    -- 전체 프로세스를 트랜잭션으로 보호 (함수 호출 자체가 기본적으로 단일 트랜잭션)
    FOR v_club_record IN SELECT * FROM jsonb_array_elements(p_clubs_json)
    LOOP
        -- 1. 구장(Club) Upsert
        INSERT INTO public.golf_clubs (name, address, is_verified)
        VALUES (
            v_club_record->>'name',
            v_club_record->>'address',
            COALESCE((v_club_record->>'isVerified')::BOOLEAN, true)
        )
        ON CONFLICT (name) DO UPDATE
        SET address = EXCLUDED.address,
            is_verified = EXCLUDED.is_verified
        RETURNING id INTO v_club_id;

        -- 2. 코스(Course) Loop
        FOR v_course_record IN SELECT * FROM jsonb_array_elements(v_club_record->'courses')
        LOOP
            INSERT INTO public.golf_courses (club_id, name, hole_count)
            VALUES (
                v_club_id,
                v_course_record->>'name',
                COALESCE(jsonb_array_length(v_course_record->'holes'), 9)
            )
            ON CONFLICT (club_id, name) DO UPDATE
            SET hole_count = EXCLUDED.hole_count
            RETURNING id INTO v_course_id;

            -- 3. 홀(Hole) Loop
            FOR v_hole_record IN SELECT * FROM jsonb_array_elements(v_course_record->'holes')
            LOOP
                INSERT INTO public.golf_holes (course_id, hole_number, par)
                VALUES (
                    v_course_id,
                    (v_hole_record->>'holeNumber')::INTEGER,
                    (v_hole_record->>'par')::INTEGER
                )
                ON CONFLICT (course_id, hole_number) DO UPDATE
                SET par = EXCLUDED.par
                RETURNING id INTO v_hole_id;

                -- 4. 전장(Distance) Loop
                IF v_hole_record ? 'distances' THEN
                    FOR v_dist_record IN SELECT * FROM jsonb_array_elements(v_hole_record->'distances')
                    LOOP
                        INSERT INTO public.hole_distances (hole_id, tee_color, distance_meter)
                        VALUES (
                            v_hole_id,
                            v_dist_record->>'teeColor',
                            (v_dist_record->>'distanceMeter')::INTEGER
                        )
                        ON CONFLICT (hole_id, tee_color) DO UPDATE
                        SET distance_meter = EXCLUDED.distance_meter;
                    END LOOP;
                END IF;
            END LOOP;
        END LOOP;
        
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_count,
        'message', v_count || ' clubs processed successfully'
    );

EXCEPTION WHEN OTHERS THEN
    -- 에러 발생 시 자동 롤백됨
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;
