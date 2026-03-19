/**
 * @file src/modules/golf/application/golf.application.service.ts
 * @description Application service for orchestrating golf-related use cases.
 * Handles the logic for starting, saving, and finishing rounds by coordinating domain and infrastructure layers.
 */

import { RoundRepository, ClubRepository, MatchRepository } from '../domain/repositories';
import { golfDomainService } from '../domain/services/golf.domain.service';
import { 
    GolfRound, 
    HoleRecord, 
    ActiveCourseSession, 
    ClubSummary,
    SelectionStep
} from '../domain/golf.types';
import { GOLF_LIMITS, MISS_SHOT_PATTERNS } from '../domain/golf.constants';
import { logger } from '../../../shared/utils/logger';

export class GolfApplicationService {
    constructor(
        private roundRepository: RoundRepository,
        private clubRepository: ClubRepository,
        private matchRepository: MatchRepository
    ) {}

    /**
     * Start a new round session.
     * Orchestrates validation, data loading, and initial state persistence.
     * 
     * @throws 'PAST_DATE_LIMIT' | 'DAILY_LIMIT_EXCEEDED' | 'COURSE_LOAD_FAILED'
     */
    async startNewRound(params: {
        tee: string;
        tempSelection: {
            club: ClubSummary;
            outCourse: { id: string; name: string };
            inCourse: { id: string; name: string };
        };
        roundId?: string;
        roundDate?: string;
        holeRecords?: HoleRecord[];
    }): Promise<{
        roundId: string;
        roundDate: string;
        session: ActiveCourseSession;
        initialRound: GolfRound;
    }> {
        const { tee, tempSelection, roundId, roundDate, holeRecords = [] } = params;
        const today = new Date().toISOString().split("T")[0];

        // 1. Validate date (No past dates allowed for new rounds)
        if (roundDate && roundDate < today) {
            throw new Error("PAST_DATE_LIMIT");
        }

        // 2. Validate daily count limit
        const todayCount = await this.roundRepository.getRoundsCountByDate(today);
        if (todayCount >= GOLF_LIMITS.MAX_DAILY_ROUNDS) {
            throw new Error("DAILY_LIMIT_EXCEEDED");
        }

        // 3. Fetch detailed course data (including holes and par information)
        const [outData, inData] = await Promise.all([
            this.clubRepository.getCourseWithHoles(tempSelection.outCourse.id),
            this.clubRepository.getCourseWithHoles(tempSelection.inCourse.id),
        ]);

        if (!outData || !inData) throw new Error("COURSE_LOAD_FAILED");

        const targetId = roundId || "round_" + Date.now();
        const courseComboName = `${outData.name}-${inData.name}`;

        // Create the active session object for state synchronization
        const session: ActiveCourseSession = {
            clubId: tempSelection.club.id,
            clubName: tempSelection.club.name,
            outCourse: outData,
            inCourse: inData,
            combinedPars: golfDomainService.calculateCombinedPars(outData.holes, inData.holes),
            availableTees: tee ? [tee] : ["White"],
        };

        const initialRound: GolfRound = {
            id: targetId,
            date: roundId ? roundDate! : today,
            courseName: tempSelection.club.name,
            courseType: courseComboName,
            outCourseId: tempSelection.outCourse.id,
            inCourseId: tempSelection.inCourse.id,
            holes: roundId ? holeRecords : [],
            updatedAt: Date.now(),
            teeColor: tee,
            memo: "",
        };

        // Persist the round as the current active round
        await Promise.all([
            this.roundRepository.setCurrentRoundId(targetId),
            this.roundRepository.saveRound(initialRound),
        ]);

        return {
            roundId: targetId,
            roundDate: initialRound.date,
            session,
            initialRound
        };
    }

    /**
     * Save current hole data and initiate background synchronization.
     * Coordinates record updates and interaction with the persistence layer.
     */
    async saveHoleRecord(params: {
        roundId: string;
        roundDate: string;
        activeSession: ActiveCourseSession;
        currentHole: number;
        scoreData: {
            par: number;
            stroke: number;
            putt: number;
            ob: number;
            penalty: number;
            missShot: string;
        };
        holeRecords: HoleRecord[];
        selectedTee: string;
    }): Promise<{
        updatedRecords: HoleRecord[];
        syncPromise: Promise<{ success: boolean; error?: any }>;
    }> {
        const { roundId, roundDate, activeSession, currentHole, scoreData, holeRecords, selectedTee } = params;
        
        // Construct the hole record based on domain logic
        const currentRecord: HoleRecord = {
            holeNo: currentHole,
            par: scoreData.par,
            stroke: scoreData.stroke,
            putt: scoreData.putt,
            isGIR: golfDomainService.isGIR(scoreData.stroke, scoreData.putt, scoreData.par),
            ob: scoreData.ob,
            penalty: scoreData.penalty,
            missShot: scoreData.missShot === MISS_SHOT_PATTERNS.NONE || !scoreData.missShot ? undefined : scoreData.missShot,
        };

        // Update the list of hole records
        const updatedRecords = [
            ...holeRecords.filter((r) => r.holeNo !== currentHole),
            currentRecord,
        ].sort((a, b) => a.holeNo - b.holeNo);

        // Update the round entity
        const currentRound: GolfRound = {
            id: roundId,
            date: roundDate,
            courseName: activeSession.clubName,
            courseType: `${activeSession.outCourse.name}-${activeSession.inCourse.name}`,
            outCourseId: activeSession.outCourse.id,
            inCourseId: activeSession.inCourse.id,
            holes: updatedRecords,
            updatedAt: Date.now(),
            teeColor: selectedTee,
            memo: "",
        };

        // Save locally and trigger sync
        await this.roundRepository.saveRound(currentRound);
        const syncPromise = this.roundRepository.syncRoundToSupabase(currentRound);

        return {
            updatedRecords,
            syncPromise
        };
    }

    /**
     * Finalize the round session by clearing the active round indicator.
     */
    async finishRound(): Promise<void> {
        await this.roundRepository.setCurrentRoundId(null);
    }

    /**
     * Load the current active session or restore it from persistent storage.
     * Incorporates Auto-Repair logic for data integrity.
     */
    async loadSession(params: {
        mode?: string;
        currentSelectionStep: SelectionStep;
    }): Promise<{
        session: ActiveCourseSession | null;
        roundId: string | null;
        roundDate: string | null;
        tee: string;
        records: HoleRecord[];
    } | null> {
        const { mode, currentSelectionStep } = params;

        // Skip loading if in intermediate selection state without an explicit mode override
        if (currentSelectionStep !== 'club' && !mode) return null;

        const savedId = await this.roundRepository.getCurrentRoundId();
        
        // No saved session or explicit 'new' mode → start fresh state
        if (!savedId || mode === 'new') {
            return {
                session: null,
                roundId: null,
                roundDate: null,
                tee: 'White',
                records: [],
            };
        }

        const currentRound = await this.roundRepository.getRoundById(savedId);
        if (!currentRound) return null;

        let outCourseId = currentRound.outCourseId;
        let inCourseId = currentRound.inCourseId;

        // --- Auto-Repair Pass A (Name-based local repair) ---
        if (!outCourseId || !inCourseId) {
            logger.info('[GolfAppService] Course IDs missing — starting name-based auto-repair');
            const repaired = await this.matchRepository.repairRoundCourseIds(
                currentRound.courseName,
                currentRound.courseType
            );
            if (repaired.outCourseId && repaired.inCourseId) {
                outCourseId = repaired.outCourseId;
                inCourseId = repaired.inCourseId;
                const updatedRound = { ...currentRound, outCourseId, inCourseId, updatedAt: Date.now() };
                await this.roundRepository.saveRound(updatedRound);
                this.roundRepository.syncRoundToSupabase(updatedRound); // background sync
            }
        }

        if (outCourseId && inCourseId) {
            let outData = await this.clubRepository.getCourseWithHoles(outCourseId);
            let inData = await this.clubRepository.getCourseWithHoles(inCourseId);

            // --- Auto-Repair Pass B (Remote pull if local cache missing) ---
            if (!outData || !inData) {
                logger.info('[GolfAppService] Course data missing after ID repair — pulling from remote');
                await this.roundRepository.pullRoundsFromSupabase(true);
                outData = await this.clubRepository.getCourseWithHoles(outCourseId);
                inData = await this.clubRepository.getCourseWithHoles(inCourseId);
            }

            if (outData && inData) {
                const outTees = outData.holes[0]?.distances.map(d => d.teeColor) || [];
                const inTees  = inData.holes[0]?.distances.map(d => d.teeColor) || [];
                const commonTees = outTees.filter(t => inTees.includes(t));

                const session: ActiveCourseSession = {
                    clubId: outData.clubId,
                    clubName: currentRound.courseName,
                    outCourse: outData,
                    inCourse: inData,
                    combinedPars: golfDomainService.calculateCombinedPars(outData.holes, inData.holes),
                    availableTees: commonTees.length > 0 ? commonTees : ['White'],
                };

                return {
                    session,
                    roundId: savedId,
                    roundDate: currentRound.date,
                    tee: currentRound.teeColor || 'White',
                    records: currentRound.holes || [],
                };
            }
        }

        // Return progress so far even if session hydration (course details) failed
        return {
            session: null,
            roundId: savedId,
            roundDate: currentRound.date,
            tee: currentRound.teeColor || 'White',
            records: currentRound.holes || [],
        };
    }

    /**
     * Synchronize all data (pull from remote and retry any pending local syncs).
     * Orchestrates the overall synchronization workflow.
     */
    async syncAll(): Promise<{ pulledCount: number; syncedCount: number }> {
        logger.info('[GolfAppService] Starting full synchronization');
        
        const pullRes = await this.roundRepository.pullRoundsFromSupabase(true);
        const retryRes = await this.roundRepository.retryPendingSyncs();
        
        logger.info('[GolfAppService] Synchronization complete', { 
            pulled: pullRes.count, 
            synced: retryRes.success 
        });

        return {
            pulledCount: pullRes.count,
            syncedCount: retryRes.success
        };
    }
}
