import { supabase } from '../../../shared/lib/supabase';
import { logger } from '../../../shared/utils/logger';
import { golfService } from '../golf.service';
import type { GolfDomainError } from '../golf.types';

export const clubMutationRepository = {
    async registerClub(payload: {
        clubName: string;
        isVerified?: boolean;
        courses: {
            courseName: string;
            holes: {
                holeNumber: number;
                par: number;
                distances?: { teeColor: string; distanceMeter: number }[];
            }[];
        }[];
    }): Promise<{ success: boolean; clubId?: string; error?: GolfDomainError }> {
        for (const course of payload.courses) {
            const invalidHoles = course.holes.filter(h => h.par < 3 || h.par > 7);
            if (invalidHoles.length > 0) {
                const msg = `[Par Validation Error] "${course.courseName}" course has holes with invalid Par (outside 3~7): ${invalidHoles.map(h => h.holeNumber).join(', ')}`;
                logger.error(msg);
                return {
                    success: false,
                    error: { code: 'VALIDATION_FAILED', message: msg }
                };
            }
        }
        try {
            const normalizedClubName = golfService.normalizeClubName(payload.clubName);
            const { data: clubData, error: clubErr } = await supabase
                .from('golf_clubs')
                .upsert({ name: normalizedClubName, is_verified: payload.isVerified }, { onConflict: 'name' })
                .select('id, is_verified')
                .single();
            const club = clubData as { id: string } | null;

            if (clubErr || !club) throw clubErr ?? new Error('Club upsert failed');

            for (const course of payload.courses) {
                const { data: courseData, error: courseErr } = await supabase
                    .from('golf_courses')
                    .upsert(
                        { club_id: club.id, name: course.courseName, hole_count: course.holes.length },
                        { onConflict: 'club_id,name' }
                    )
                    .select('id')
                    .single();

                const newCourse = courseData as { id: string } | null;

                if (courseErr || !newCourse) throw courseErr ?? new Error('Course upsert failed');

                const holesToInsert = course.holes.map(h => ({
                    course_id: newCourse.id,
                    hole_number: h.holeNumber,
                    par: h.par,
                }));

                const { data: holesData, error: holesErr } = await supabase
                    .from('golf_holes')
                    .upsert(holesToInsert, { onConflict: 'course_id,hole_number' })
                    .select('id, hole_number');
                const insertedHoles = holesData as { id: string; hole_number: number }[] | null;

                if (holesErr || !insertedHoles) throw holesErr ?? new Error('Holes batch upsert failed');

                const distanceEntries: { hole_id: string; tee_color: string; distance_meter: number }[] = [];
                for (const hole of course.holes) {
                    if (hole.distances && hole.distances.length > 0) {
                        const holeId = (insertedHoles as { id: string; hole_number: number }[])
                            .find(ih => ih.hole_number === hole.holeNumber)?.id;
                        if (holeId) {
                            hole.distances.forEach(d => {
                                distanceEntries.push({
                                    hole_id: holeId,
                                    tee_color: d.teeColor,
                                    distance_meter: d.distanceMeter,
                                });
                            });
                        }
                    }
                }

                if (distanceEntries.length > 0) {
                    const { error: distErr } = await supabase
                        .from('hole_distances')
                        .upsert(distanceEntries, { onConflict: 'hole_id,tee_color' });

                    if (distErr) throw distErr;
                }
            }

            logger.info(`[clubRepository] "${payload.clubName}" club registered successfully (id: ${club.id})`);
            return { success: true, clubId: (club as { id: string }).id };

        } catch (e: unknown) {
            logger.error('[clubRepository] registerClub failed', e);
            return {
                success: false,
                error: {
                    code: 'STORAGE_ERROR',
                    message: e instanceof Error ? e.message : 'Club registration failed',
                    details: e,
                }
            };
        }
    },

    async deleteGolfCourse(courseId: string): Promise<{ success: boolean; error?: GolfDomainError }> {
        try {
            const { error: outErr } = await supabase
                .from('rounds')
                .update({ out_course_id: null })
                .eq('out_course_id', courseId);

            if (outErr) throw outErr;

            const { error: inErr } = await supabase
                .from('rounds')
                .update({ in_course_id: null })
                .eq('in_course_id', courseId);

            if (inErr) throw inErr;

            const { error: delErr } = await supabase
                .from('golf_courses')
                .delete()
                .eq('id', courseId);

            if (delErr) throw delErr;

            logger.info(`[clubRepository] golf_course deleted (id: ${courseId})`);
            return { success: true };
        } catch (e: unknown) {
            logger.error('[clubRepository] deleteGolfCourse failed', e);
            return {
                success: false,
                error: {
                    code: 'STORAGE_ERROR',
                    message: e instanceof Error ? e.message : 'Course deletion failed',
                    details: e,
                }
            };
        }
    },

    async registerClubsBulk(clubs: unknown[]): Promise<{ success: boolean; count: number; error?: GolfDomainError }> {
        const CHUNK_SIZE = 50;
        let totalProcessed = 0;

        try {
            for (let i = 0; i < clubs.length; i += CHUNK_SIZE) {
                const chunk = clubs.slice(i, i + CHUNK_SIZE);
                const { data, error } = (await supabase.rpc('insert_clubs_bulk', {
                    p_clubs_json: chunk,
                })) as { data: unknown; error: { message: string } | null };

                if (error) throw error;

                const result = data as { success: boolean; count: number; error?: string };
                if (!result.success) throw new Error(result.error);

                totalProcessed += result.count;
            }
            return { success: true, count: totalProcessed };
        } catch (e: unknown) {
            logger.error('[clubRepository] registerClubsBulk failed', e);
            return {
                success: false,
                count: totalProcessed,
                error: {
                    code: 'STORAGE_ERROR',
                    message: e instanceof Error ? e.message : 'Bulk registration failed',
                    details: e,
                }
            };
        }
    },
};
