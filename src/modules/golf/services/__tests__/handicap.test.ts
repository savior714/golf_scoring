/**
 * @file src/modules/golf/services/__tests__/handicap.test.ts
 * @description Unit tests for USGA-style handicap estimation logic.
 */

import { golfService } from '../../golf.service';
import { GolfRound, HoleRecord } from '../../golf.types';

/**
 * Creates a mock GolfRound with a specific total score.
 * For simplicity, we put all strokes into a single hole record, 
 * as estimateHandicap only cares about the totalScore via calculateSummary.
 */
const createMockRound = (id: string, totalScore: number, date: string = '2026-03-17'): GolfRound => {
    const holes: HoleRecord[] = [
        {
            holeNo: 1,
            par: 72,
            stroke: totalScore,
            putt: 2,
            isGIR: false,
            ob: 0,
            penalty: 0,
            missShot: '없음'
        }
    ];
    return {
        id,
        date,
        courseName: 'Test CC',
        courseType: 'Test Course',
        holes,
        updatedAt: new Date(date).getTime()
    };
};

describe('golfService.estimateHandicap', () => {
    it('데이터가 5개 미만인 경우 null을 반환해야 함', () => {
        const rounds = [
            createMockRound('1', 80),
            createMockRound('2', 85),
            createMockRound('3', 90),
            createMockRound('4', 78)
        ];
        expect(golfService.estimateHandicap(rounds)).toBeNull();
    });

    it('5개의 라운드가 있을 때 상위 2개(40%)의 차분을 반영하여 계산해야 함', () => {
        // Scores: [80, 82, 85, 90, 75] 
        // Differentials (Par 72): [8, 10, 13, 18, 3]
        // Sorted: [3, 8, 10, 13, 18]
        // Best 2: [3, 8] -> Avg: 5.5
        // 5.5 * 0.96 = 5.28 -> 소수점 첫째 자리 절삭 -> 5.2
        const rounds = [80, 82, 85, 90, 75].map((s, i) => createMockRound(i.toString(), s));
        expect(golfService.estimateHandicap(rounds)).toBe(5.2);
    });

    it('최근 20경기까지만 계산 대상에 포함해야 함', () => {
        // 30경기 입력, 앞의 20경기는 모두 80타, 뒤의 10경기는 모두 70타
        // slice(0, 20)에 의해 80타인 경기들만 계산되어야 함
        const latestRounds = Array.from({ length: 20 }, (_, i) => createMockRound(`new_${i}`, 80));
        const oldRounds = Array.from({ length: 10 }, (_, i) => createMockRound(`old_${i}`, 70));
        
        const allRounds = [...latestRounds, ...oldRounds];
        
        // 80타 경기들: Diff = 8
        // 8 * 0.96 = 7.68 -> 7.6
        expect(golfService.estimateHandicap(allRounds)).toBe(7.6);
    });

    it('평균 차분에 0.96 계수를 곱하고 소수점 첫째 자리에서 절삭해야 함 (USGA 방식)', () => {
        // Avg Diff가 10.08인 경우 -> 9.676... -> 9.6
        // (10.08 * 0.96 = 9.6768)
        // Avg Diff를 10.5로 맞춤 (10, 11 평균)
        // 10.5 * 0.96 = 10.08 -> 10.0
        const rounds = [82, 83, 82, 83, 82].map((s, i) => createMockRound(i.toString(), s));
        // Diffs: [10, 11, 10, 11, 10] -> Sorted: [10, 10, 10, 11, 11]
        // Best 2: [10, 10] -> Avg: 10
        // 10 * 0.96 = 9.6 -> 9.6
        expect(golfService.estimateHandicap(rounds)).toBe(9.6);
    });

    it('빈 데이터 배열인 경우 null을 반환해야 함', () => {
        expect(golfService.estimateHandicap([])).toBeNull();
    });

    it('라운드 데이터가 null인 경우 null을 반환해야 함', () => {
        expect(golfService.estimateHandicap(null as any)).toBeNull();
    });
});
