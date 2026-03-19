import { supabase } from '../../../../shared/lib/supabase';
import { logger } from '../../../../shared/utils/logger';
import { ClubCourseInfo, ClubInfo, ClubSummary } from '../../domain/golf.types';
import { GolfError } from '../../domain/errors';
import { ClubRepository } from '../../domain/repositories/ClubRepository';
import { golfDomainService } from '../../domain/services/golf.domain.service';

/** Supabase DB Row Types for Internal Mapping */
interface DbHoleDistance {
  tee_color: string;
  distance_meter: number;
}

interface DbHole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
  handicap_idx?: number;
  hole_distances?: DbHoleDistance[];
}

interface DbCourse {
  id: string;
  club_id: string;
  name: string;
  hole_count: number;
  golf_holes?: DbHole[];
}

interface DbClub {
  id: string;
  name: string;
  is_verified?: boolean;
  golf_courses?: DbCourse[];
}

export class ClubRepositoryImpl implements ClubRepository {
  private courseCache = new Map<string, ClubCourseInfo>();

  async getAllClubsSummary(signal?: AbortSignal): Promise<ClubSummary[]> {
    try {
      let query = supabase.from('golf_clubs').select(`
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

      if (error) throw error;

      const typedClubs = (data as unknown as DbClub[]) || [];
      return typedClubs.map((club) => ({
        id: club.id,
        name: club.name,
        isVerified: club.is_verified,
        courseCount: club.golf_courses?.length ?? 0,
        courses: (club.golf_courses || []).map((c) => ({
          id: c.id,
          name: c.name,
          holeCount: c.hole_count,
        })),
      }));
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] getAllClubsSummary failed', e);
      throw new GolfError('STORAGE_ERROR', 'Failed to fetch clubs summary', e);
    }
  }

  async getCourseWithHoles(courseId: string, signal?: AbortSignal): Promise<ClubCourseInfo | null> {
    if (this.courseCache.has(courseId)) {
      return this.courseCache.get(courseId) || null;
    }

    try {
      let query = supabase
        .from('golf_courses')
        .select(
          `
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
                `
        )
        .eq('id', courseId);

      if (signal) {
        query = (query as any).abortSignal(signal);
      }

      const { data, error } = await (query as any).single();

      if (error || !data) {
        if (error) logger.error('[ClubRepositoryImpl] getCourseWithHoles failed', error);
        return null;
      }

      const typedData = data as unknown as DbCourse;
      const holes = (typedData.golf_holes || [])
        .sort((a, b) => a.hole_number - b.hole_number)
        .map((h) => ({
          id: h.id,
          courseId: h.course_id,
          holeNumber: h.hole_number,
          par: h.par,
          handicapIdx: h.handicap_idx,
          distances: (h.hole_distances || []).map((d) => ({
            teeColor: d.tee_color,
            distanceMeter: d.distance_meter,
          })),
        }));

      const result: ClubCourseInfo = {
        id: typedData.id,
        clubId: typedData.club_id,
        name: typedData.name,
        holeCount: typedData.hole_count,
        holes,
      };

      this.courseCache.set(courseId, result);
      return result;
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] getCourseWithHoles unexpected error', e);
      throw new GolfError('STORAGE_ERROR', 'Failed to fetch course data', e);
    }
  }

  async getClubFullInfo(clubId: string): Promise<ClubInfo | null> {
    try {
      const { data, error } = await supabase
        .from('golf_clubs')
        .select(
          `
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
                `
        )
        .eq('id', clubId)
        .single();

      if (error || !data) {
        if (error) logger.error('[ClubRepositoryImpl] getClubFullInfo failed', error);
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
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] getClubFullInfo unexpected error', e);
      throw new GolfError('STORAGE_ERROR', 'Failed to fetch full club info', e);
    }
  }

  // --- Mutations ---

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
  }): Promise<{ success: boolean; clubId?: string; error?: any }> {
    for (const course of payload.courses) {
      const invalidHoles = course.holes.filter((h) => h.par < 3 || h.par > 7);
      if (invalidHoles.length > 0) {
        const msg = `[Par Validation Error] "${
          course.courseName
        }" course has holes with invalid Par (outside 3~7): ${invalidHoles
          .map((h) => h.holeNumber)
          .join(', ')}`;
        logger.error(msg);
        return {
          success: false,
          error: new GolfError('VALIDATION_FAILED', msg),
        };
      }
    }

    try {
      const normalizedClubName = golfDomainService.normalizeClubName(payload.clubName);
      const { data: clubData, error: clubErr } = await supabase
        .from('golf_clubs')
        .upsert({ name: normalizedClubName, is_verified: payload.isVerified }, { onConflict: 'name' })
        .select('id, is_verified')
        .single();

      if (clubErr || !clubData) throw clubErr ?? new Error('Club upsert failed');
      const clubId = clubData.id;

      for (const course of payload.courses) {
        const { data: courseData, error: courseErr } = await supabase
          .from('golf_courses')
          .upsert(
            { club_id: clubId, name: course.courseName, hole_count: course.holes.length },
            { onConflict: 'club_id,name' }
          )
          .select('id')
          .single();

        if (courseErr || !courseData) throw courseErr ?? new Error('Course upsert failed');
        const newCourseId = courseData.id;

        const holesToInsert = course.holes.map((h) => ({
          course_id: newCourseId,
          hole_number: h.holeNumber,
          par: h.par,
        }));

        const { data: holesData, error: holesErr } = await supabase
          .from('golf_holes')
          .upsert(holesToInsert, { onConflict: 'course_id,hole_number' })
          .select('id, hole_number');

        if (holesErr || !holesData) throw holesErr ?? new Error('Holes batch upsert failed');
        const insertedHoles = holesData as { id: string; hole_number: number }[];

        const distanceEntries: { hole_id: string; tee_color: string; distance_meter: number }[] = [];
        for (const hole of course.holes) {
          if (hole.distances && hole.distances.length > 0) {
            const holeId = insertedHoles.find((ih) => ih.hole_number === hole.holeNumber)?.id;
            if (holeId) {
              hole.distances.forEach((d) => {
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

      logger.info(
        `[ClubRepositoryImpl] "${payload.clubName}" club registered successfully (id: ${clubId})`
      );
      return { success: true, clubId: clubId };
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] registerClub failed', e);
      return {
        success: false,
        error: new GolfError('STORAGE_ERROR', e instanceof Error ? e.message : 'Club registration failed', e),
      };
    }
  }

  async deleteGolfCourse(courseId: string): Promise<{ success: boolean; error?: any }> {
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

      const { error: delErr } = await supabase.from('golf_courses').delete().eq('id', courseId);

      if (delErr) throw delErr;

      this.courseCache.delete(courseId);
      logger.info(`[ClubRepositoryImpl] golf_course deleted (id: ${courseId})`);
      return { success: true };
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] deleteGolfCourse failed', e);
      return {
        success: false,
        error: new GolfError('STORAGE_ERROR', e instanceof Error ? e.message : 'Course deletion failed', e),
      };
    }
  }

  async registerClubsBulk(
    clubs: unknown[]
  ): Promise<{ success: boolean; count: number; error?: any }> {
    let totalProcessed = 0;
    const CHUNK_SIZE = 50;

    try {
      const normalizedClubs = (clubs as { name?: string }[]).map((club) => ({
        ...club,
        name: golfDomainService.normalizeClubName(club.name ?? ''),
      }));

      for (let i = 0; i < normalizedClubs.length; i += CHUNK_SIZE) {
        const chunk = normalizedClubs.slice(i, i + CHUNK_SIZE);
        const { data, error } = (await supabase.rpc('insert_clubs_bulk', {
          p_clubs_json: chunk,
        })) as { data: any; error: any };

        if (error) throw error;

        const result = data as { success: boolean; count: number; error?: string };
        if (!result.success) throw new Error(result.error);

        totalProcessed += result.count;
      }
      return { success: true, count: totalProcessed };
    } catch (e: unknown) {
      logger.error('[ClubRepositoryImpl] registerClubsBulk failed', e);
      return {
        success: false,
        count: totalProcessed,
        error: new GolfError('STORAGE_ERROR', e instanceof Error ? e.message : 'Bulk registration failed', e),
      };
    }
  }
}
