import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase';
import { AsyncLock } from '../../shared/lib/async-lock';
import { golfService } from './golf.service';
import type { ClubCourseInfo, ClubInfo, ClubSummary, GolfRound } from './golf.types';

const BASE_STORAGE_KEY = '@golf_rounds_data';
const PENDING_SYNC_KEY = '@pending_sync_ids';
const storageLock = new AsyncLock();
const syncLocks = new Map<string, AsyncLock>();

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
                const localRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
                return localRounds;
            } catch (e) {
                console.error('Failed to fetch rounds from local storage', e);
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
                if (!roundsData || roundsData.length === 0) return { success: true, count: 0 };

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
                    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
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

                const key = await getStorageKey();
                if (!key) return { success: false, count: 0 };
                const localJson = await AsyncStorage.getItem(key);
                const localRounds: GolfRound[] = localJson ? JSON.parse(localJson) : [];

                const mergedRounds = golfService.resolveMergedRounds(localRounds, remoteRounds);
                await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
                return { success: true, count: remoteRounds.length };
            } catch (e) {
                console.error('[roundRepository] pullRoundsFromSupabase failed:', e);
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
                const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
                const updatedRounds = [roundToSave, ...existingRounds.filter(r => r.id !== newRound.id)];
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
            } catch (e) {
                console.error('Failed to save round', e);
            }
        });
    },

    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: unknown }> {
        // Round ID별 비동기 Lock 확보 (Race Condition 방지)
        if (!syncLocks.has(round.id)) {
            syncLocks.set(round.id, new AsyncLock());
        }
        const lock = syncLocks.get(round.id)!;

        return lock.run(async () => {
            try {
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

                // Success: Remove from pending queue if exists
                await this._removeFromSyncQueue(round.id);
                return { success: true };
            } catch (e) {
                console.error(`[roundRepository] syncRoundToSupabase failed for ${round.id}:`, e);
                // Failure: Add to pending queue
                await this._addToSyncQueue(round.id);
                return { success: false, error: e };
            }
        });
    },

    async _addToSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            const queue: string[] = queueStr ? JSON.parse(queueStr) : [];
            if (!queue.includes(roundId)) {
                queue.push(roundId);
                await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
            }
        } catch (e) {
            console.error('Failed to add to sync queue', e);
        }
    },

    async _removeFromSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return;
            const queue: string[] = JSON.parse(queueStr);
            const filtered = queue.filter(id => id !== roundId);
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
        } catch (e) {
            console.error('Failed to remove from sync queue', e);
        }
    },

    async retryPendingSyncs(): Promise<{ attempted: number; success: number }> {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return { attempted: 0, success: 0 };
            
            const queue: string[] = JSON.parse(queueStr);
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
        } catch (e) {
            console.error('Retry pending syncs failed', e);
            return { attempted: 0, success: 0 };
        }
    },

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

    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: unknown[] }> {
        const rounds = await this.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: unknown[] = results
            .filter(r => !r.success)
            .map((r, i) => ({ id: rounds[i].id, error: r.error }));

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },

    async deleteRound(roundId: string): Promise<void> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) throw new Error('Authentication required');
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
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

            } catch (e) {
                console.error('Failed to delete round', e);
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
                console.error(msg);
                return { success: false, error: msg };
            }
        }
        try {
            const { data: club, error: clubErr } = await supabase
                .from('golf_clubs')
                .upsert({ name: payload.clubName }, { onConflict: 'name' })
                .select('id')
                .single();

            if (clubErr || !club) throw clubErr ?? new Error('Club upsert failed');

            for (const course of payload.courses) {
                const { data: newCourse, error: courseErr } = await supabase
                    .from('golf_courses')
                    .upsert(
                        { club_id: club.id, name: course.courseName, hole_count: course.holes.length },
                        { onConflict: 'club_id,name' }
                    )
                    .select('id')
                    .single();

                if (courseErr || !newCourse) throw courseErr ?? new Error('Course upsert failed');

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

                const distanceEntries: any[] = [];
                for (const hole of course.holes) {
                    if (hole.distances && hole.distances.length > 0) {
                        const holeId = insertedHoles.find(ih => ih.hole_number === hole.holeNumber)?.id;
                        if (holeId) {
                            hole.distances.forEach(d => {
                                distanceEntries.push({
                                    hole_id: holeId,
                                    tee_color: d.tee_color,
                                    distance_meter: d.distance_meter,
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