import { ClubSummary, ClubInfo, ClubCourseInfo } from '../golf.types';

export interface ClubRepository {
  /**
   * Retrieves a summary list of all available golf clubs.
   * @param signal Optional AbortSignal for cancellation.
   */
  getAllClubsSummary(signal?: AbortSignal): Promise<ClubSummary[]>;

  /**
   * Retrieves full details for a specific club.
   */
  getClubFullInfo(clubId: string): Promise<ClubInfo | null>;

  /**
   * Retrieves course details including hole information.
   * @param courseId ID of the course.
   * @param signal Optional AbortSignal for cancellation.
   */
  getCourseWithHoles(courseId: string, signal?: AbortSignal): Promise<ClubCourseInfo | null>;
  /**
   * Registers a new club with its courses and holes.
   */
  registerClub(payload: {
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
  }): Promise<{ success: boolean; clubId?: string; error?: any }>;

  /**
   * Deletes a golf course and updates related rounds.
   */
  deleteGolfCourse(courseId: string): Promise<{ success: boolean; error?: any }>;

  /**
   * Performs bulk registration of clubs via RPC.
   */
  registerClubsBulk(clubs: unknown[]): Promise<{ success: boolean; count: number; error?: any }>;
}
