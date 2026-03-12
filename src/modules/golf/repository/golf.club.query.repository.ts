import { supabase } from '../../../shared/lib/supabase';
import { logger } from '../../../shared/utils/logger';
import type { ClubCourseInfo, ClubInfo, ClubSummary } from '../golf.types';

/** Supabase DB Row Types for Internal Mapping */
export interface DbHoleDistance {
    tee_color: string;
    distance_meter: number;
}

export interface DbHole {
    id: string;
    course_id: string;
    hole_number: number;
    par: number;
    handicap_idx?: number;
    hole_distances?: DbHoleDistance[];
}

export interface DbCourse {
    id: string;
    club_id: string;
    name: string;
    hole_count: number;
    golf_holes?: DbHole[];
}

export interface DbClub {
    id: string;
    name: string;
    is_verified?: boolean;
    golf_courses?: DbCourse[];
}

export const clubQueryRepository = {
    async getAllClubsSummary(signal?: AbortSignal): Promise<ClubSummary[]> {
        let query = supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
                is_verified,
                golf_courses (
                    id,
                    name,
                    hole_count
                )
            `);

        if (signal) {
            query = (query as any).abortSignal(signal);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (error) {
            logger.error('[clubRepository] getAllClubsSummary failed', error);
            return [];
        }

        const typedClubs = (data as unknown as DbClub[]) || [];
        return typedClubs.map(club => ({
            id: club.id,
            name: club.name,
            isVerified: club.is_verified,
            courseCount: club.golf_courses?.length ?? 0,
            courses: (club.golf_courses || []).map(c => ({
                id: c.id,
                name: c.name,
                holeCount: c.hole_count,
            })),
        }));
    },

    async getCourseWithHoles(courseId: string, signal?: AbortSignal): Promise<ClubCourseInfo | null> {
        let query = supabase
            .from('golf_courses')
            .select(`
                id,
                club_id,
                name,
                hole_count,
                golf_holes (
                    id,
                    course_id,
                    hole_number,
                    par,
                    handicap_idx,
                    hole_distances (
                        tee_color,
                        distance_meter
                    )
                )
            `)
            .eq('id', courseId);

        if (signal) {
            query = (query as any).abortSignal(signal);
        }

        const { data, error } = await (query as any).single();

        if (error || !data) {
            logger.error('[clubRepository] getCourseWithHoles failed', error);
            return null;
        }

        const typedData = data as unknown as DbCourse;
        const holes = (typedData.golf_holes || [])
            .sort((a, b) => a.hole_number - b.hole_number)
            .map(h => ({
                id: h.id,
                courseId: h.course_id,
                holeNumber: h.hole_number,
                par: h.par,
                handicapIdx: h.handicap_idx,
                distances: (h.hole_distances || []).map(d => ({
                    teeColor: d.tee_color,
                    distanceMeter: d.distance_meter,
                })),
            }));

        return {
            id: typedData.id,
            clubId: typedData.club_id,
            name: typedData.name,
            holeCount: typedData.hole_count,
            holes,
        };
    },

    async getClubFullInfo(clubId: string): Promise<ClubInfo | null> {
        const { data, error } = await supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
                is_verified,
                golf_courses (
                    id,
                    club_id,
                    name,
                    hole_count,
                    golf_holes (
                        id,
                        course_id,
                        hole_number,
                        par,
                        handicap_idx,
                        hole_distances (
                            tee_color,
                            distance_meter
                        )
                    )
                )
            `)
            .eq('id', clubId)
            .single();

        if (error || !data) {
            logger.error('[clubRepository] getClubFullInfo failed', error);
            return null;
        }

        const typedData = data as unknown as DbClub;
        const courses = (typedData.golf_courses || []).map((course: DbCourse) => ({
            id: course.id,
            clubId: course.club_id,
            name: course.name,
            holeCount: course.hole_count,
            holes: (course.golf_holes || [])
                .sort((a, b) => a.hole_number - b.hole_number)
                .map((h: DbHole) => ({
                    id: h.id,
                    courseId: h.course_id,
                    holeNumber: h.hole_number,
                    par: h.par,
                    handicapIdx: h.handicap_idx,
                    distances: (h.hole_distances || []).map((d: DbHoleDistance) => ({
                        teeColor: d.tee_color,
                        distanceMeter: d.distance_meter,
                    })),
                })),
        }));

        return {
            id: typedData.id,
            name: typedData.name,
            isVerified: typedData.is_verified,
            courses,
        };
    },
};
