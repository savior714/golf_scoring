import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../../shared/lib/supabase';
import { AsyncLock } from '../../../../shared/lib/async-lock';
import { logger } from '../../../../shared/utils/logger';
import { GolfRound } from '../../domain/golf.types';
import { GolfError } from '../../domain/errors';
import { RoundRepository } from '../../domain/repositories/RoundRepository';
import { golfDomainService } from '../../domain/services/golf.domain.service';

const BASE_STORAGE_KEY = '@golf_rounds_data';
const PENDING_SYNC_KEY = '@pending_sync_ids';
const MAX_SYNC_QUEUE_SIZE = 20;
const LAST_PULL_TIME_KEY = '@last_pull_time';
const PULL_THROTTLE_MS = 30 * 60 * 1000;

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

export class RoundRepositoryImpl implements RoundRepository {
  private storageLock = new AsyncLock();
  private syncLocks = new Map<string, AsyncLock>();
  private storageKeyPromise: Promise<string | null> | null = null;
  private isRetryingPending = false;

  constructor() {
    supabase.auth.onAuthStateChange(() => {
      this.storageKeyPromise = null;
    });
  }

  private async getStorageKey(): Promise<string | null> {
    if (this.storageKeyPromise) return this.storageKeyPromise;
    this.storageKeyPromise = supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return null;
      return `${BASE_STORAGE_KEY}_${session.user.id}`;
    });
    return this.storageKeyPromise;
  }

  // --- RoundRepository Implementation ---

  async getAllRounds(): Promise<GolfRound[]> {
    return this.storageLock.run(async () => {
      try {
        const key = await this.getStorageKey();
        if (!key) return [];
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
      } catch (e: unknown) {
        logger.error('Failed to fetch rounds from local storage', e);
        throw new GolfError('STORAGE_ERROR', 'Failed to fetch rounds from local storage', e);
      }
    });
  }

  async getRoundById(roundId: string): Promise<GolfRound | null> {
    const all = await this.getAllRounds();
    return all.find((r) => r.id === roundId) || null;
  }

  async saveRound(newRound: GolfRound): Promise<void> {
    return this.storageLock.run(async () => {
      try {
        const roundToSave = { ...newRound, updatedAt: Date.now() };
        const key = await this.getStorageKey();
        if (!key) throw new GolfError('AUTH_REQUIRED', 'Authentication required');

        const jsonValue = await AsyncStorage.getItem(key);
        const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
        const updatedRounds = [roundToSave, ...existingRounds.filter((r) => r.id !== newRound.id)];

        await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
      } catch (e: unknown) {
        logger.error('Failed to save round', e);
        if (e instanceof GolfError) throw e;
        throw new GolfError(
          'STORAGE_ERROR',
          e instanceof Error ? e.message : 'Failed to save round to local storage',
          e
        );
      }
    });
  }

  async deleteRound(roundId: string): Promise<void> {
    return this.storageLock.run(async () => {
      try {
        const key = await this.getStorageKey();
        if (!key) throw new GolfError('AUTH_REQUIRED', 'Authentication required');

        const jsonValue = await AsyncStorage.getItem(key);
        const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
        await AsyncStorage.setItem(key, JSON.stringify(existingRounds.filter((r) => r.id !== roundId)));

        if ((await this.getCurrentRoundId()) === roundId) {
          await this.setCurrentRoundId(null);
        }

        await this.removeFromSyncQueue(roundId);
        this.syncLocks.delete(roundId);

        const { error: delErr } = await supabase.from('rounds').delete().eq('id', roundId);
        if (delErr) throw delErr;
      } catch (e: unknown) {
        logger.error('Failed to delete round', e);
        if (e instanceof GolfError) throw e;
        throw new GolfError(
          'STORAGE_ERROR',
          e instanceof Error ? e.message : 'Failed to delete round',
          e
        );
      }
    });
  }

  async getCurrentRoundId(): Promise<string | null> {
    const userIdKey = await this.getStorageKey();
    if (!userIdKey) return null;
    return await AsyncStorage.getItem(`${userIdKey}_current_id`);
  }

  async setCurrentRoundId(roundId: string | null): Promise<void> {
    const userIdKey = await this.getStorageKey();
    if (!userIdKey) return;
    const currentRoundKey = `${userIdKey}_current_id`;
    if (roundId === null) {
      await AsyncStorage.removeItem(currentRoundKey);
    } else {
      await AsyncStorage.setItem(currentRoundKey, roundId);
    }
  }

  // --- Sync Methods ---

  async pullRoundsFromSupabase(
    force = false
  ): Promise<{ success: boolean; count: number; error?: any; skipped?: boolean }> {
    return this.storageLock.run(async () => {
      try {
        const sessionResponse = await supabase.auth
          .getSession()
          .catch(() => ({ data: { session: null }, error: null }));

        const { session } = sessionResponse.data;
        const sessionError = sessionResponse.error;

        if (!session || sessionError) {
          return {
            success: false,
            count: 0,
            error: new GolfError('AUTH_REQUIRED', 'No active session found'),
          };
        }

        const key = await this.getStorageKey();
        if (!key) {
          return {
            success: false,
            count: 0,
            error: new GolfError('AUTH_REQUIRED', 'Failed to resolve storage key'),
          };
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
        const roundIds = typedRounds.map((r) => r.id);

        const { data: holesData, error: holesError } = await supabase
          .from('holes')
          .select('*')
          .in('round_id', roundIds);

        if (holesError) throw holesError;
        const typedHoles = (holesData as unknown as DbHoleRow[]) || [];

        const remoteRounds: GolfRound[] = typedRounds.map((r) => ({
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
            .filter((h) => h.round_id === r.id)
            .map((h) => ({
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
        const mergedRounds = golfDomainService.resolveMergedRounds(localRounds, remoteRounds);

        await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
        await AsyncStorage.setItem(LAST_PULL_TIME_KEY, Date.now().toString());

        return { success: true, count: remoteRounds.length };
      } catch (e: unknown) {
        logger.error('[RoundRepositoryImpl] pullRoundsFromSupabase failed:', e);
        return {
          success: false,
          count: 0,
          error: new GolfError('STORAGE_ERROR', 'Failed to pull rounds', e),
        };
      }
    });
  }

  async syncRoundToSupabase(
    round: GolfRound,
    retries = 2
  ): Promise<{ success: boolean; error?: any }> {
    if (!this.syncLocks.has(round.id)) {
      this.syncLocks.set(round.id, new AsyncLock());
    }
    const lock = this.syncLocks.get(round.id)!;

    return lock.run(async () => {
      const performSync = async (): Promise<void> => {
        const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const session = sessionRes.data.session;

        if (!session) throw new Error('Not authenticated');

        const { error: roundError } = await supabase.from('rounds').upsert({
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
          logger.error(`[RoundRepositoryImpl] Rounds upsert failed for ${round.id}`, roundError);
          throw roundError;
        }

        if (round.holes.length > 0) {
          const holesToSync = round.holes.map((h) => ({
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
          await this.removeFromSyncQueue(round.id);
          return { success: true };
        } catch (e: unknown) {
          currentAttempt++;
          const message = e instanceof Error ? e.message : String(e);
          const errStatus =
            e && typeof e === 'object' && 'status' in e ? (e as { status: number }).status : undefined;
          const isNetworkError = message.includes('Network') || errStatus === 0 || !errStatus;

          if (currentAttempt <= retries && isNetworkError) {
            await new Promise((res) => setTimeout(res, Math.pow(2, currentAttempt) * 1000));
            continue;
          }
          await this.addToSyncQueue(round.id);
          return {
            success: false,
            error: new GolfError('STORAGE_ERROR', message, e),
          };
        }
      }
      return {
        success: false,
        error: new GolfError('STORAGE_ERROR', 'Maximum sync retries exceeded'),
      };
    });
  }

  async syncAllLocalRounds(): Promise<{
    total: number;
    success: number;
    errors: { id: string; error: any }[];
  }> {
    const rounds = await this.getAllRounds();
    const results = await Promise.all(rounds.map((round) => this.syncRoundToSupabase(round)));

    const errors: { id: string; error: any }[] = results
      .map((r, i) => (!r.success && r.error ? { id: rounds[i].id, error: r.error } : null))
      .filter((err): err is { id: string; error: any } => err !== null);

    return { total: rounds.length, success: rounds.length - errors.length, errors };
  }

  async retryPendingSyncs(): Promise<{ attempted: number; success: number }> {
    if (this.isRetryingPending) return { attempted: 0, success: 0 };
    this.isRetryingPending = true;
    try {
      const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (!queueStr) return { attempted: 0, success: 0 };
      const queue = JSON.parse(queueStr) as string[];
      const rounds = await this.getAllRounds();
      let successCount = 0;
      for (const roundId of queue) {
        const round = rounds.find((r) => r.id === roundId);
        if (round && (await this.syncRoundToSupabase(round)).success) successCount++;
      }
      return { attempted: queue.length, success: successCount };
    } finally {
      this.isRetryingPending = false;
    }
  }

  async getRoundsCountByDate(date: string): Promise<number> {
    const rounds = await this.getAllRounds();
    return rounds.filter((r) => r.date === date).length;
  }

  async getSyncQueueCount(): Promise<number> {
    try {
      const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (!queueStr) return 0;
      const queue = JSON.parse(queueStr) as string[];
      return queue.length;
    } catch (e) {
      logger.error('Failed to get sync queue count', e);
      return 0;
    }
  }

  // --- Helper Queue Methods ---

  private async addToSyncQueue(roundId: string) {
    try {
      const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const queue = queueStr ? (JSON.parse(queueStr) as string[]) : [];
      if (queue.includes(roundId)) return;
      queue.push(roundId);
      const nextQueue =
        queue.length > MAX_SYNC_QUEUE_SIZE ? queue.slice(queue.length - MAX_SYNC_QUEUE_SIZE) : queue;
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(nextQueue));
    } catch (e) {
      logger.error('Failed to add sync queue', e);
    }
  }

  private async removeFromSyncQueue(roundId: string) {
    try {
      const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (!queueStr) return;
      const queue = JSON.parse(queueStr) as string[];
      await AsyncStorage.setItem(
        PENDING_SYNC_KEY,
        JSON.stringify(queue.filter((id) => id !== roundId))
      );
    } catch (e) {
      logger.error('Failed to remove sync queue', e);
    }
  }
}
