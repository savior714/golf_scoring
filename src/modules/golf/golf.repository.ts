import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase';
import { AsyncLock } from '../../shared/lib/async-lock';
import type { ClubCourseInfo, ClubInfo, ClubSummary, GolfRound } from './golf.types';

const BASE_STORAGE_KEY = '@golf_rounds_data';
const storageLock = new AsyncLock();

/**
 * User-session-based storage key caching (Singleton Promise pattern)
 * - Ensures getSession() is called only once even during concurrent calls (eliminates Race Condition)
 */
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

// Reset cache on auth state change (re-computed on next call)
supabase.auth.onAuthStateChange(() => {
    storageKeyPromise = null;
});

export const roundRepository = {
    /**
     * Retrieve all round records
     */
    async getAllRounds(): Promise<GolfRound[]> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) return [];
                const jsonValue = await AsyncStorage.getItem(key);
                const localRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
                return localRounds;
            } catch (e) {
                console.error('Failed to fetch rounds from local storage', e);
                return [];
            }
        });
    },

    /**
     * Fetch all round data from the cloud (Supabase)
     */
    async pullRoundsFromSupabase(sessionOverride?: import('@supabase/supabase-js').Session | null): Promise<{ success: boolean; count: number; error?: unknown }> {
        return storageLock.run(async () => {
            try {
                // sessionOverride: Directly use the session passed from onAuthStateChange callback (prevents timing mismatch)
                const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
                if (!session) return { success: false, count: 0 };

                // 1. Query round records
                const { data: roundsData, error: roundsError } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false });

                if (roundsError) throw roundsError;
                if (!roundsData || roundsData.length === 0) return { success: true, count: 0 };

                // 2. Query all hole records in one request (optimized)
                const roundIds = roundsData.map(r => r.id);
                const { data: holesData, error: holesError } = await supabase
                    .from('holes')
                    .select('*')
                    .in('round_id', roundIds);

                if (holesError) throw holesError;

                const remoteRounds: GolfRound[] = roundsData.map(r => ({
                    id: r.id,
                    date: r.date,
                    courseName: r.course_name,
                    courseType: r.course_type,
                    teeColor: r.tee_color,
                    outCourseId: r.out_course_id,
                    inCourseId: r.in_course_id,
                    memo: r.memo || '',
                    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0,
                    holes: (holesData || [])
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

                // 4. Merge with local data (latest wins by ID)
                const key = await getStorageKey();
                if (!key) return { success: false, count: 0 };
                const localJson = await AsyncStorage.getItem(key);
                const localRounds: GolfRound[] = localJson ? JSON.parse(localJson) : [];

                // Merge logic: Cloud vs Local — the one with the larger updatedAt value takes precedence
                const mergedRoundsMap = new Map<string, GolfRound>();

                // 1) Fill map with local data first
                localRounds.forEach(r => mergedRoundsMap.set(r.id, r));

                // 2) Safe Sync: Overwrite if cloud data is STRICTLY more recent,
                // or if equal timestamp but cloud has more hole records (prevents partial sync wipeout)
                remoteRounds.forEach(remote => {
                    const local = mergedRoundsMap.get(remote.id);
                    if (!local) {
                        mergedRoundsMap.set(remote.id, remote);
                    } else if (remote.updatedAt > (local.updatedAt || 0)) {
                        mergedRoundsMap.set(remote.id, remote);
                    } else if (remote.updatedAt === (local.updatedAt || 0)) {
                        if (remote.holes.length > local.holes.length) {
                            mergedRoundsMap.set(remote.id, remote);
                        }
                    }
                });

                const mergedRounds = Array.from(mergedRoundsMap.values());
                await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
                return { success: true, count: remoteRounds.length };
            } catch (e) {
                console.error('Failed to pull from Supabase', e);
                return { success: false, count: 0, error: e };
            }
        });
    },

    /**
     * Save or update a round record
     */
    async saveRound(newRound: GolfRound): Promise<void> {
        return storageLock.run(async () => {
            try {
                // Update updatedAt at the moment of saving
                const roundToSave = { ...newRound, updatedAt: Date.now() };
                const key = await getStorageKey();
                if (!key) throw new Error('Authentication required');
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
                const updatedRounds = [roundToSave, ...existingRounds.filter(r => r.id !== newRound.id)];
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
            } catch (e) {
                console.error('Failed to save round', e);
            }
        });
    },

    /**
     * Sync round to Supabase cloud
     */
    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: unknown }> {
        try {
            // 0. Identify user
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // 1. Upsert round record
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

            // 2. Upsert hole records (Batch)
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

            return { success: true };
        } catch (e) {
            console.error('Supabase sync failed', e);
            return { success: false, error: e };
        }
    },

    /**
     * Get the current active round ID
     */
    async getCurrentRoundId(): Promise<string | null> {
        try {
            const userIdKey = await getStorageKey();
            if (!userIdKey) return null;
            const currentRoundKey = `${userIdKey}_current_id`;
            return await AsyncStorage.getItem(currentRoundKey);
        } catch (e) {
            return null;
        }
    },

    /**
     * Set the current active round ID
     */
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
        } catch (e) {
            console.error('Failed to set current round ID', e);
        }
    },

    /**
     * Batch sync all local data to Supabase
     */
    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: unknown[] }> {
        const rounds = await this.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: unknown[] = results
            .filter(r => !r.success)
            .map((r, i) => ({ id: rounds[i].id, error: r.error }));

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },



    /**
     * Delete a round record
     */
    async deleteRound(roundId: string): Promise<void> {
        return storageLock.run(async () => {
            try {
                // 1. Delete from local storage
                const key = await getStorageKey();
                if (!key) throw new Error('Authentication required');
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
                const updatedRounds = existingRounds.filter(r => r.id !== roundId);
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));

                // Reset current round ID if it matches the deleted round
                const currentId = await this.getCurrentRoundId();
                if (currentId === roundId) {
                    await this.setCurrentRoundId(null);
                }

                // 2. Delete from remote (Supabase) - holes auto-deleted by cascade
                const { error } = await supabase.from('rounds').delete().eq('id', roundId);
                if (error) throw error;

            } catch (e) {
                console.error('Failed to delete round', e);
                throw e;
            }
        });
    }
};

// ============================================================
// [CLUB MASTER REPOSITORY] Club master data CRUD
// ============================================================

export const clubRepository = {

    /**
     * Fetch all clubs summary (lightweight - for club selection dropdown).
     * Uses a single JOIN query to prevent N+1 problem.
     */
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
            console.error('[clubRepository] getAllClubsSummary failed', error);
            return [];
        }

        return (data || []).map(club => ({
            id: club.id,
            name: club.name,
            courseCount: (club.golf_courses as any[])?.length ?? 0,
            courses: ((club.golf_courses as any[]) || []).map(c => ({
                id: c.id,
                name: c.name,
                holeCount: c.hole_count,
            })),
        }));
    },

    /**
     * Fetch full hole + distance info for a specific course (for loading Par data at round start)
     */
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
            console.error('[clubRepository] getCourseWithHoles failed', error);
            return null;
        }

        const holes = ((data.golf_holes as any[]) || [])
            .sort((a, b) => a.hole_number - b.hole_number)
            .map(h => ({
                id: h.id,
                courseId: h.course_id,
                holeNumber: h.hole_number,
                par: h.par,
                handicapIdx: h.handicap_idx,
                distances: ((h.hole_distances as any[]) || []).map((d: any) => ({
                    teeColor: d.tee_color,
                    distanceMeter: d.distance_meter,
                })),
            }));

        return {
            id: data.id,
            clubId: data.club_id,
            name: data.name,
            holeCount: data.hole_count,
            holes,
        };
    },

    /**
     * Register a new club (Guarantees Club > Course > Hole > Distance insertion order).
     * - Prevents duplicate registration with upsert pattern.
     * - Pre-validates per-hole Par range (3~7).
     */
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
        // [Validation] Per-hole Par range check (must be 3~7)
        for (const course of payload.courses) {
            const invalidHoles = course.holes.filter(h => h.par < 3 || h.par > 7);
            if (invalidHoles.length > 0) {
                const msg = `[Par Validation Error] "${course.courseName}" course has holes with invalid Par (outside 3~7): holes ${invalidHoles.map(h => h.holeNumber).join(', ')}`;
                console.error(msg);
                return { success: false, error: msg };
            }
        }
        try {
            // 1. Club upsert
            const { data: club, error: clubErr } = await supabase
                .from('golf_clubs')
                .upsert({ name: payload.clubName }, { onConflict: 'name' })
                .select('id')
                .single();

            if (clubErr || !club) throw clubErr ?? new Error('Club upsert failed');

            for (const course of payload.courses) {
                // 2. Course upsert
                const { data: newCourse, error: courseErr } = await supabase
                    .from('golf_courses')
                    .upsert(
                        { club_id: club.id, name: course.courseName, hole_count: course.holes.length },
                        { onConflict: 'club_id,name' }
                    )
                    .select('id')
                    .single();

                if (courseErr || !newCourse) throw courseErr ?? new Error('Course upsert failed');

                // 3. Batch Hole upsert
                const holesToInsert = course.holes.map(h => ({
                    course_id: newCourse.id,
                    hole_number: h.holeNumber,
                    par: h.par
                }));

                const { data: insertedHoles, error: holesErr } = await supabase
                    .from('golf_holes')
                    .upsert(holesToInsert, { onConflict: 'course_id,hole_number' })
                    .select('id, hole_number');

                if (holesErr || !insertedHoles) throw holesErr ?? new Error('Holes batch upsert failed');

                // 4. Batch Distance upsert
                const distanceEntries: any[] = [];
                for (const hole of course.holes) {
                    if (hole.distances && hole.distances.length > 0) {
                        const holeId = insertedHoles.find(ih => ih.hole_number === hole.holeNumber)?.id;
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

            console.log(`[clubRepository] "${payload.clubName}" club registered successfully (id: ${club.id})`);
            return { success: true, clubId: club.id };

        } catch (e: any) {
            console.error('[clubRepository] registerClub failed', e);
            return { success: false, error: e?.message ?? String(e) };
        }

    },

    /**
     * Fetch full course + hole + distance info for a specific club (for edit mode)
     */
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
            console.error('[clubRepository] getClubFullInfo failed', error);
            return null;
        }

        const courses = ((data.golf_courses as any[]) || []).map(c => ({
            id: c.id,
            clubId: c.club_id,
            name: c.name,
            holeCount: c.hole_count,
            holes: ((c.golf_holes as any[]) || [])
                .sort((a, b) => a.hole_number - b.hole_number)
                .map(h => ({
                    id: h.id,
                    courseId: h.course_id,
                    holeNumber: h.hole_number,
                    par: h.par,
                    handicapIdx: h.handicap_idx,
                    distances: ((h.hole_distances as any[]) || []).map((d: any) => ({
                        teeColor: d.tee_color,
                        distanceMeter: d.distance_meter,
                    })),
                })),
        }));

        return {
            id: data.id,
            name: data.name,
            courses,
        };
    },
};

