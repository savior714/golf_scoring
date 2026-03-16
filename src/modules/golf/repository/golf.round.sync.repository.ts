import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../shared/lib/supabase';
import { AsyncLock } from '../../../shared/lib/async-lock';
import { logger } from '../../../shared/utils/logger';
import { golfService } from '../golf.service';
import type { GolfRound, GolfDomainError } from '../golf.types';
import {
    storageLock,
    syncLocks,
    getStorageKey,
    PENDING_SYNC_KEY,
    LAST_PULL_TIME_KEY,
    PULL_THROTTLE_MS,
    localRoundRepository,
} from './golf.round.local.repository';

/** Supabase DB Row Types for Internal Mapping */
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
    is_gir: boolean;
    ob: number;
    penalty: number;
    miss_shot?: string;
}

let isRetryingPending = false;

export const syncRoundRepository = {
    async pullRoundsFromSupabase(
        sessionOverride?: import('@supabase/supabase-js').Session | null,
        force = false
    ): Promise<{ success: boolean; count: number; error?: GolfDomainError; skipped?: boolean }> {
        return storageLock.run(async () => {
            try {
                // getSession()은 로그아웃 애니메이션 등 Race Condition 상황에서 
                // Invalid Refresh Token 에러를 발생시킬 수 있으므로 안전하게 감싸서 처리
                const { data: { session }, error: sessionError } = sessionOverride
                    ? { data: { session: sessionOverride }, error: null }
                    : await supabase.auth.getSession().catch(() => ({ data: { session: null }, error: null }));

                if (!session || sessionError) {
                    return { success: false, count: 0, error: { code: 'AUTH_REQUIRED', message: 'No active session found' } };
                }

                const key = await getStorageKey();
                if (!key) {
                    return { success: false, count: 0, error: { code: 'AUTH_REQUIRED', message: 'Failed to resolve storage key' } };
                }

                if (!force) {
                    const lastPullStr = await AsyncStorage.getItem(LAST_PULL_TIME_KEY);
                    if (lastPullStr && Date.now() - parseInt(lastPullStr, 10) < PULL_THROTTLE_MS) {
                        return { success: true, count: 0, skipped: true };
                    }
                }

                const { data: roundsData, error: roundsError } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false });

                if (roundsError) throw roundsError;
                if (!roundsData || roundsData.length === 0) return { success: true, count: 0 };

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
                            isGIR: h.is_gir,
                            ob: h.ob,
                            penalty: h.penalty,
                            missShot: h.miss_shot,
                        }))
                        .sort((a, b) => a.holeNo - b.holeNo),
                }));

                const localJson = await AsyncStorage.getItem(key);
                const localRounds = localJson ? (JSON.parse(localJson) as GolfRound[]) : [];
                const mergedRounds = golfService.resolveMergedRounds(localRounds, remoteRounds);

                await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
                await AsyncStorage.setItem(LAST_PULL_TIME_KEY, Date.now().toString());

                return { success: true, count: remoteRounds.length };
            } catch (e: unknown) {
                logger.error('[roundRepository] pullRoundsFromSupabase failed:', e);
                return { success: false, count: 0, error: { code: 'STORAGE_ERROR', message: 'Failed to pull rounds', details: e } };
            }
        });
    },

    async syncRoundToSupabase(round: GolfRound, retries = 2): Promise<{ success: boolean; error?: GolfDomainError }> {
        if (!syncLocks.has(round.id)) {
            syncLocks.set(round.id, new AsyncLock());
        }
        const lock = syncLocks.get(round.id)!;

        return lock.run(async () => {
            const performSync = async (): Promise<void> => {
                const { data: { session } } = await supabase.auth.getSession()
                    .catch(() => ({ data: { session: null } }));

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
                        updated_at: new Date(round.updatedAt || Date.now()).toISOString(),
                    });

                if (roundError) {
                    logger.error(`[roundRepository] Rounds upsert failed for ${round.id}`, roundError);
                    throw roundError;
                }

                if (round.holes.length > 0) {
                    const holesToSync = round.holes.map(h => ({
                        round_id: round.id,
                        hole_no: h.holeNo,
                        par: h.par,
                        stroke: h.stroke,
                        putt: h.putt,
                        is_gir: h.isGIR,
                        ob: h.ob,
                        penalty: h.penalty,
                        miss_shot: h.missShot,
                    }));

                    const { error: holeError } = await supabase
                        .from('holes')
                        .upsert(holesToSync, { onConflict: 'round_id,hole_no' });

                    if (holeError) throw holeError;
                }
            };

            let currentAttempt = 0;
            while (currentAttempt <= retries) {
                try {
                    await performSync();
                    await localRoundRepository._removeFromSyncQueue(round.id);
                    return { success: true };
                } catch (e: unknown) {
                    currentAttempt++;
                    const message = e instanceof Error ? e.message : String(e);
                    const errStatus = (e && typeof e === 'object' && 'status' in e) ? (e as { status: number }).status : undefined;
                    const isNetworkError = message.includes('Network') || errStatus === 0 || !errStatus;

                    if (currentAttempt <= retries && isNetworkError) {
                        await new Promise(res => setTimeout(res, Math.pow(2, currentAttempt) * 1000));
                        continue;
                    }
                    await localRoundRepository._addToSyncQueue(round.id);
                    return {
                        success: false,
                        error: {
                            code: 'STORAGE_ERROR',
                            message: message,
                            details: e,
                        } satisfies GolfDomainError
                    };
                }
            }
            return {
                success: false,
                error: {
                    code: 'STORAGE_ERROR',
                    message: 'Maximum sync retries exceeded',
                } satisfies GolfDomainError
            };
        });
    },

    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: { id: string; error: GolfDomainError }[] }> {
        const rounds = await localRoundRepository.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: { id: string; error: GolfDomainError }[] = results
            .map((r, i) => !r.success && r.error ? { id: rounds[i].id, error: r.error } : null)
            .filter((err): err is { id: string; error: GolfDomainError } => err !== null);

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },

    async retryPendingSyncs(): Promise<{ attempted: number; success: number }> {
        if (isRetryingPending) return { attempted: 0, success: 0 };
        isRetryingPending = true;
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return { attempted: 0, success: 0 };
            const queue = JSON.parse(queueStr) as string[];
            const rounds = await localRoundRepository.getAllRounds();
            let successCount = 0;
            for (const roundId of queue) {
                const round = rounds.find(r => r.id === roundId);
                if (round && (await this.syncRoundToSupabase(round)).success) successCount++;
            }
            return { attempted: queue.length, success: successCount };
        } finally { isRetryingPending = false; }
    },
};
