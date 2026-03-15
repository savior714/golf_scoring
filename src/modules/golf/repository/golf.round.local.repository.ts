import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../shared/lib/supabase';
import { AsyncLock } from '../../../shared/lib/async-lock';
import { logger } from '../../../shared/utils/logger';
import type { GolfRound, GolfDomainError } from '../golf.types';

export const BASE_STORAGE_KEY = '@golf_rounds_data';
export const PENDING_SYNC_KEY = '@pending_sync_ids';
export const MAX_SYNC_QUEUE_SIZE = 20;
export const LAST_PULL_TIME_KEY = '@last_pull_time';
export const PULL_THROTTLE_MS = 30 * 60 * 1000;

export const storageLock = new AsyncLock();
export const syncLocks = new Map<string, AsyncLock>();

let storageKeyPromise: Promise<string | null> | null = null;

export function getStorageKey(): Promise<string | null> {
    if (storageKeyPromise) return storageKeyPromise;
    storageKeyPromise = supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.id) return null;
        return `${BASE_STORAGE_KEY}_${session.user.id}`;
    });
    return storageKeyPromise;
}

supabase.auth.onAuthStateChange(() => {
    storageKeyPromise = null;
});

export const localRoundRepository = {
    async getAllRounds(): Promise<GolfRound[]> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) return [];
                const jsonValue = await AsyncStorage.getItem(key);
                return jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
            } catch (e: unknown) {
                logger.error('Failed to fetch rounds from local storage', e);
                throw {
                    code: 'STORAGE_ERROR',
                    message: 'Failed to fetch rounds from local storage',
                    details: e,
                } satisfies GolfDomainError;
            }
        });
    },

    async getRoundsCountByDate(date: string): Promise<number> {
        const all = await this.getAllRounds();
        return all.filter(r => r.date === date).length;
    },

    async saveRound(newRound: GolfRound): Promise<void> {
        return storageLock.run(async () => {
            try {
                const roundToSave = { ...newRound, updatedAt: Date.now() };
                const key = await getStorageKey();
                if (!key) throw { code: 'AUTH_REQUIRED', message: 'Authentication required' } satisfies GolfDomainError;
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
                const updatedRounds = [roundToSave, ...existingRounds.filter(r => r.id !== newRound.id)];
                await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
            } catch (e: unknown) {
                logger.error('Failed to save round', e);
                if (e && typeof e === 'object' && 'code' in e) throw e;
                throw {
                    code: 'STORAGE_ERROR',
                    message: e instanceof Error ? e.message : 'Failed to save round to local storage',
                    details: e,
                } satisfies GolfDomainError;
            }
        });
    },

    async deleteRound(roundId: string): Promise<void> {
        return storageLock.run(async () => {
            try {
                const key = await getStorageKey();
                if (!key) throw { code: 'AUTH_REQUIRED', message: 'Authentication required' } satisfies GolfDomainError;
                const jsonValue = await AsyncStorage.getItem(key);
                const existingRounds = jsonValue != null ? (JSON.parse(jsonValue) as GolfRound[]) : [];
                await AsyncStorage.setItem(key, JSON.stringify(existingRounds.filter(r => r.id !== roundId)));
                if (await this.getCurrentRoundId() === roundId) await this.setCurrentRoundId(null);
                await this._removeFromSyncQueue(roundId);
                syncLocks.delete(roundId);
                const { error: delErr } = await supabase.from('rounds').delete().eq('id', roundId);
                if (delErr) throw delErr;
            } catch (e: unknown) {
                logger.error('Failed to delete round', e);
                if (e && typeof e === 'object' && 'code' in e) throw e;
                throw {
                    code: 'STORAGE_ERROR',
                    message: e instanceof Error ? e.message : 'Failed to delete round',
                    details: e,
                } satisfies GolfDomainError;
            }
        });
    },

    async getCurrentRoundId(): Promise<string | null> {
        const userIdKey = await getStorageKey();
        return userIdKey ? await AsyncStorage.getItem(`${userIdKey}_current_id`) : null;
    },

    async setCurrentRoundId(roundId: string | null): Promise<void> {
        const userIdKey = await getStorageKey();
        if (!userIdKey) return;
        const currentRoundKey = `${userIdKey}_current_id`;
        roundId === null
            ? await AsyncStorage.removeItem(currentRoundKey)
            : await AsyncStorage.setItem(currentRoundKey, roundId);
    },

    async _addToSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            let queue = queueStr ? (JSON.parse(queueStr) as string[]) : [];
            if (queue.includes(roundId)) return;
            queue.push(roundId);
            if (queue.length > MAX_SYNC_QUEUE_SIZE) queue = queue.slice(queue.length - MAX_SYNC_QUEUE_SIZE);
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
        } catch (e) { logger.error('Failed to add sync queue', e); }
    },

    async _removeFromSyncQueue(roundId: string) {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return;
            const queue = JSON.parse(queueStr) as string[];
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue.filter(id => id !== roundId)));
        } catch (e) { logger.error('Failed to remove sync queue', e); }
    },

    async pruneSyncQueue(): Promise<number> {
        try {
            const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            if (!queueStr) return 0;
            const queue = JSON.parse(queueStr) as string[];
            const rounds = await this.getAllRounds();
            const existingIds = new Set(rounds.map(r => r.id));
            const pruned = queue.filter(id => existingIds.has(id));
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pruned));
            return queue.length - pruned.length;
        } catch (e) { return 0; }
    },

    async getSyncQueueCount(): Promise<number> {
        const queueStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        return queueStr ? (JSON.parse(queueStr) as string[]).length : 0;
    },
};
