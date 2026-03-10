import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase';
import { AsyncLock } from '../../shared/lib/async-lock';
import { golfService } from './golf.service';
import type { ClubCourseInfo, ClubInfo, ClubSummary, GolfRound } from './golf.types';
import { logger } from '../../shared/utils/logger';

const BASE_STORAGE_KEY = '@golf_rounds_data';
const PENDING_SYNC_KEY = '@pending_sync_ids';
const storageLock = new AsyncLock();
const syncLocks = new Map<string, AsyncLock>();

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
    golf_courses?: DbCourse[];
}

interface DbRoundRow {
    id: string;
    user_id: string;
    date: string;
    course_name: string;
    course_type: string;
    tee_color?: string;
    out_course_id?: string;
    in_course_id?: string;
    memo?: string;
    updated_at?: string;
}

interface DbHoleRow {
    id: string;
    round_id: string;
    hole_no: number;
    par: number;
    stroke: number;
    putt: number;
    is_fairway: boolean;
    is_gir: boolean;
    ob: number;
    penalty: number;
    miss_shot?: string;
}

let storageKeyPromise: Promise<string | null> | null = null;

function getStorageKey(): Promise<string | null> {
    if (storageKeyPromise) return storageKeyPromise;

    storageKeyPromise = supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.id) {
            return null;
        }
        return `${BASE_STORAGE_KEY}_${session.user.id}`;
    });

    return storageKeyPromise;
}

supabase.auth.onAuthStateChange(() => {
    storageKeyPromise = null;
});

export const roundRepository = {
    async getAllRounds(): Promise<GolfRound[]> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) return [];
                const jsonValue = await AsyncStorage.getItem(key);
                const localRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
                return localRounds;
            } catch (e: unknown) {
                logger.error('Failed to fetch rounds from local storage', e);
                return [];
            }
        });
    },

    async pullRoundsFromSupabase(sessionOverride?: import('@supabase/supabase-js').Session | null): Promise<{ success: boolean; count: number; error?: unknown }> {
        return storageLock.run(async () => {
            try {
                const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
                if (!session) return { success: false, count: 0 };

                const { data: roundsData, error: roundsError } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false });

                if (roundsError) throw roundsError;
                if (!roundsData || (roundsData as DbRoundRow[]).length === 0) return { success: true, count: 0 };

                const typedRounds = roundsData as DbRoundRow[];
                const roundIds = typedRounds.map(r => r.id);
                
                const { data: holesData, error: holesError } = await supabase
                    .from('holes')
                    .select('*')
                    .in('round_id', roundIds);

                if (holesError) throw holesError;

                const typedHoles = (holesData as unknown as DbHoleRow[]) || [];

                const remoteRounds: GolfRound[] = typedRounds.map(r => ({
                    id: r.id,
                    date: r.date,
                    courseName: r.course_name,
                    courseType: r.course_type,
                    teeColor: r.tee_color,
                    outCourseId: r.out_course_id,
                    inCourseId: r.in_course_id,
                    memo: r.memo || '',
                    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
                    holes: typedHoles
                        .filter(h => h.round_id === r.id)
                        .map(h => ({
                            holeNo: h.hole_no,
                            par: h.par,
                            stroke: h.stroke,
                            putt: h.putt,
                            isFairway: h.is_fairway,
                            isGIR: h.is_gir,
                            ob: h.ob,
                            penalty: h.penalty,
                            missShot: h.miss_shot
                        }))
                        .sort((a, b) => a.holeNo - b.holeNo)
                }));

                const key = await getStorageKey();
                if (!key) return { success: false, count: 0 };
                const localJson = await AsyncStorage.getItem(key);
                const localRounds = localJson ? (JSON.parse(localJson) as GolfRound[]) : [];

                const mergedRounds = golfService.resolveMergedRounds(localRounds, remoteRounds);
                await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
                return { success: true, count: remoteRounds.length };
            } catch (e: unknown) {
                logger.error('[roundRepository] pullRoundsFromSupabase failed:', e);
                return { success: false, count: 0, error: e };
            }
        });
    },

    async saveRound(newRound: GolfRound): Promise<void> {
        return storageLock.run(async () => {
            try {
                const roundToSave = { ...newRound, updatedAt: Date.now() };
                const key = await getStorageKey();
                if (!key) throw new Error('Authentication required');
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
                const updatedRounds = [roundToSave, ...existingRounds.filter(r => r.id !== newRound.id)];
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
            } catch (e: unknown) {
                logger.error('Failed to save round', e);
            }
        });
    },

    async syncRoundToSupabase(round: GolfRound, retries = 2): Promise<{ success: boolean; error?: unknown }> {
        // Round ID별 비동기 Lock 확보 (Race Condition 방지)
        if (!syncLocks.has(round.id)) {
            syncLocks.set(round.id, new AsyncLock());
        }
        const lock = syncLocks.get(round.id)!;

        return lock.run(async () => {
            const performSync = async (): Promise<void> => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');

                const { error: roundError } = await supabase
                    .from('rounds')
                    .upsert({
                        id: round.id,
                        user_id: session.user.id,
                        date: round.date,
                        course_name: round.courseName,
                        course_type: round.courseType,
                        tee_color: round.teeColor,
                        out_course_id: round.outCourseId,
                        in_course_id: round.inCourseId,
                        memo: round.memo,
                        updated_at: new Date(round.updatedAt || Date.now()).toISOString()
                    });

                if (roundError) throw roundError;

                if (round.holes.length > 0) {
                    const holesToSync = round.holes.map(h => ({
                        round_id: round.id,
                        hole_no: h.holeNo,
                        par: h.par,
                        stroke: h.stroke,
                        putt: h.putt,
                        is_fairway: h.isFairway,
                        is_gir: h.isGIR,
                        ob: h.ob,
                        penalty: h.penalty,
                        miss_shot: h.missShot
                    }));

                    const { error: holeError } = await supabase
                        .from('holes')
                        .upsert(holesToSync, { onConflict: 'round_id,hole_no' });

                    if (holeError) throw holeError;
                }
            };

            let currentAttempt = 0;
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

            while (currentAttempt <= retries) {
                try {
                    await performSync();
                    logger.sync(`Successfully synced round ${round.id} (Attempt ${currentAttempt + 1})`);
                    await this._removeFromSyncQueue(round.id);
                    return { success: true };
                } catch (e: unknown) {
                    currentAttempt++;
                    const message = e instanceof Error ? e.message : String(e);
                    // Use type guard for status check
                    const errStatus = (e && typeof e === 'object' && 'status' in e) ? (e as {status: number}).status : undefined;
                    const isNetworkError = message.includes('Network') || errStatus === 0 || !errStatus;
                    
                    if (currentAttempt <= retries && isNetworkError) {
                        const backoff = Math.pow(2, currentAttempt) * 1000;
                        logger.warn(`Sync failed for ${round.id}, retrying in ${backoff}ms...`, message);
                        await delay(backoff);
                        continue;
                    }

                    logger.error(`[roundRepository] syncRoundToSupabase final failure for ${round.id}:`, e);
                    await this._addToSyncQueue(round.id);
                    return { success: false, error: e };
                }
            }
            return { success: false, error: 'Max retries reached' };
        });
    },

    async _addToSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            const queue = queueStr ? (JSON.parse(queueStr) as string[]) : [];
            if (!queue.includes(roundId)) {
                queue.push(roundId);
                await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
            }
        } catch (e: unknown) {
            logger.error('Failed to add to sync queue', e);
        }
    },

    async _removeFromSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return;
            const queue = JSON.parse(queueStr) as string[];
            const filtered = queue.filter(id => id !== roundId);
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
        } catch (e: unknown) {
            logger.error('Failed to remove from sync queue', e);
        }
    },

    async retryPendingSyncs(): Promise<{ attempted: number; success: number }> {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return { attempted: 0, success: 0 };
            
            const queue = JSON.parse(queueStr) as string[];
            if (queue.length === 0) return { attempted: 0, success: 0 };

            const rounds = await this.getAllRounds();
            let successCount = 0;

            for (const roundId of queue) {
                const round = rounds.find(r => r.id === roundId);
                if (round) {
                    const result = await this.syncRoundToSupabase(round);
                    if (result.success) successCount++;
                } else {
                    // Round no longer exists locally, remove from queue
                    await this._removeFromSyncQueue(roundId);
                }
            }
            return { attempted: queue.length, success: successCount };
        } catch (e: unknown) {
            logger.error('Retry pending syncs failed', e);
            return { attempted: 0, success: 0 };
        }
    },

    async getSyncQueueCount(): Promise<number> {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return 0;
            const queue = JSON.parse(queueStr) as string[];
            return queue.length;
        } catch (e: unknown) {
            logger.error('Failed to get sync queue count', e);
            return 0;
        }
    },

    async getCurrentRoundId(): Promise<string | null> {
        try {
            const userIdKey = await getStorageKey();
            if (!userIdKey) return null;
            const currentRoundKey = `${userIdKey}_current_id`;
            return await AsyncStorage.getItem(currentRoundKey);
        } catch (e: unknown) {
            logger.error('Failed to get current round ID', e);
            return null;
        }
    },

    async setCurrentRoundId(roundId: string | null): Promise<void> {
        try {
            const userIdKey = await getStorageKey();
            if (!userIdKey) return;
            const currentRoundKey = `${userIdKey}_current_id`;
            if (roundId === null) {
                await AsyncStorage.removeItem(currentRoundKey);
            } else {
                await AsyncStorage.setItem(currentRoundKey, roundId);
            }
        } catch (e: unknown) {
            logger.error('Failed to set current round ID', e);
        }
    },

    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: { id: string; error: unknown }[] }> {
        const rounds = await this.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: { id: string; error: unknown }[] = results
            .map((r, i) => !r.success ? { id: rounds[i].id, error: r.error } : null)
            .filter((err): err is { id: string; error: unknown } => err !== null);

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },

    async deleteRound(roundId: string): Promise<void> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) throw new Error('Authentication required');
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
                const updatedRounds = existingRounds.filter(r => r.id !== roundId);
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));

                const currentId = await this.getCurrentRoundId();
                if (currentId === roundId) {
                    await this.setCurrentRoundId(null);
                }

                await this._removeFromSyncQueue(roundId);
                
                // Cleanup sync lock for the deleted round
                syncLocks.delete(roundId);

                const { error } = await supabase.from('rounds').delete().eq('id', roundId);
                if (error) throw error;

            } catch (e: unknown) {
                logger.error('Failed to delete round', e);
                throw e;
            }
        });
    }
};

export const clubRepository = {
    async getAllClubsSummary(): Promise<ClubSummary[]> {
        const { data, error } = await supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
                golf_courses (
                    id,
                    name,
                    hole_count
                )
            `)
            .order('name', { ascending: true });

        if (error) {
            logger.error('[clubRepository] getAllClubsSummary failed', error);
            return [];
        }

        const typedClubs = (data as unknown as DbClub[]) || [];
        return typedClubs.map(club => ({
            id: club.id,
            name: club.name,
            courseCount: club.golf_courses?.length ?? 0,
            courses: (club.golf_courses || []).map(c => ({
                id: c.id,
                name: c.name,
                holeCount: c.hole_count,
            })),
        }));
    },

    async getCourseWithHoles(courseId: string): Promise<ClubCourseInfo | null> {
        const { data, error } = await supabase
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
            .eq('id', courseId)
            .single();

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

    async registerClub(payload: {
        clubName: string;
        courses: {
            courseName: string;
            holes: {
                holeNumber: number;
                par: number;
                distances?: { teeColor: string; distanceMeter: number }[];
            }[];
        }[];
    }): Promise<{ success: boolean; clubId?: string; error?: string }> {
        for (const course of payload.courses) {
            const invalidHoles = course.holes.filter(h => h.par < 3 || h.par > 7);
            if (invalidHoles.length > 0) {
                const msg = `[Par Validation Error] "${course.courseName}" course has holes with invalid Par (outside 3~7): ${invalidHoles.map(h => h.holeNumber).join(', ')}`;
                logger.error(msg);
                return { success: false, error: msg };
            }
        }
        try {
            const { data: clubData, error: clubErr } = await supabase
                .from('golf_clubs')
                .upsert({ name: payload.clubName }, { onConflict: 'name' })
                .select('id')
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
                    par: h.par
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
                        const holeId = (insertedHoles as {id: string, hole_number: number}[]).find(ih => ih.hole_number === hole.holeNumber)?.id;
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
            return { success: true, clubId: (club as {id: string}).id };

            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                logger.error('[clubRepository] registerClub failed', e);
                return { success: false, error: message };
            }

    },

    async getClubFullInfo(clubId: string): Promise<ClubInfo | null> {
        const { data, error } = await supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
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
        const courses = (typedData.golf_courses || []).map((course: DbCourse) => {
            return {
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
            };
        });

        return {
            id: typedData.id,
            name: typedData.name,
            courses,
        };
    },
};