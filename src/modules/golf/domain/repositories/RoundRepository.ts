import { GolfRound } from '../golf.types';

export interface RoundRepository {
  /**
   * Retrieves all golf rounds from storage (local/remote).
   */
  getAllRounds(): Promise<GolfRound[]>;

  /**
   * Retrieves a specific round by its ID.
   */
  getRoundById(roundId: string): Promise<GolfRound | null>;

  /**
   * Saves or updates a golf round.
   */
  saveRound(round: GolfRound): Promise<void>;

  /**
   * Deletes a golf round by its ID.
   */
  deleteRound(roundId: string): Promise<void>;

  /**
   * Gets the ID of the currently active round session.
   */
  getCurrentRoundId(): Promise<string | null>;

  /**
   * Sets the ID of the currently active round session.
   */
  setCurrentRoundId(roundId: string | null): Promise<void>;
  /**
   * Pulls rounds from Supabase and merges with local storage.
   */
  pullRoundsFromSupabase(force?: boolean): Promise<{ success: boolean; count: number; error?: any; skipped?: boolean }>;

  /**
   * Syncs a single round to Supabase.
   */
  syncRoundToSupabase(round: GolfRound, retries?: number): Promise<{ success: boolean; error?: any }>;

  /**
   * Syncs all local rounds to Supabase.
   */
  syncAllLocalRounds(): Promise<{ total: number; success: number; errors: any[] }>;

  /**
   * Retries pending syncs from the queue.
   */
  retryPendingSyncs(): Promise<{ attempted: number; success: number }>;

  /**
   * Gets the total number of rounds recorded on a specific date.
   */
  getRoundsCountByDate(date: string): Promise<number>;

  /**
   * Gets the number of rounds currently waiting in the sync queue.
   */
  getSyncQueueCount(): Promise<number>;
}
