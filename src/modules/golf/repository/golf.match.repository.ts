import { supabase } from '../../../shared/lib/supabase';
import { logger } from '../../../shared/utils/logger';
import { GolfDomainError } from '../golf.types';

export const matchRepository = {
    /**
     * round의 out/in course_id가 NULL이거나 만료된 경우,
     * courseName(구장명) + courseType(코스명 조합)을 기반으로 현재 DB에서
     * 매칭되는 코스 ID 쌍을 자동으로 찾아 반환합니다.
     */
    async repairRoundCourseIds(
        clubName: string,
        courseType: string,
    ): Promise<{ outCourseId: string | null; inCourseId: string | null }> {
        const EMPTY = { outCourseId: null, inCourseId: null };
        try {
            const { data, error } = await supabase
                .from('golf_clubs')
                .select('id, golf_courses(id, name)')
                .eq('name', clubName)
                .single();

            if (error || !data) {
                logger.warn(`[matchRepository] repairRoundCourseIds: club not found for "${clubName}"`);
                return EMPTY;
            }

            interface CourseRef { id: string; name: string }
            const courses = ((data as unknown as { golf_courses: CourseRef[] }).golf_courses) ?? [];
            if (courses.length < 2) return EMPTY;

            const firstWord = (name: string) =>
                name.trim().split(/\s+/).find(w => w.length > 1) ?? name;

            for (const pass of [1, 2, 3]) {
                for (const out of courses) {
                    for (const inn of courses) {
                        if (out.id === inn.id) continue;

                        const matched =
                            pass === 1
                                ? `${out.name}-${inn.name}` === courseType
                                : pass === 2
                                ? courseType.includes(out.name) && courseType.includes(inn.name)
                                : courseType.includes(firstWord(out.name)) && courseType.includes(firstWord(inn.name));

                        if (matched) {
                            logger.info(
                                `[matchRepository] repairRoundCourseIds: pass-${pass} match — out:"${out.name}" in:"${inn.name}" (club:"${clubName}")`
                            );
                            return { outCourseId: out.id, inCourseId: inn.id };
                        }
                    }
                }
            }

            logger.warn(`[matchRepository] repairRoundCourseIds: no match — courseType:"${courseType}" club:"${clubName}"`);
            return EMPTY;
        } catch (e: unknown) {
            logger.error('[matchRepository] repairRoundCourseIds unexpected error', e);
            throw {
                code: 'STORAGE_ERROR',
                message: 'Failed to repair course IDs',
                details: e,
            } satisfies GolfDomainError;
        }
    }
};
