/**
 * @file src/modules/golf/domain/repositories/MatchRepository.ts
 * @description Interface for matching and repairing course data based on names/patterns.
 */

export interface MatchRepository {
  /**
   * Attempts to find matching out/in course IDs based on club name and course type string.
   * Used for repairing legacy or mismatched data.
   */
  repairRoundCourseIds(
    clubName: string,
    courseType: string
  ): Promise<{ outCourseId: string | null; inCourseId: string | null }>;
}
