import { golfService } from '../golf.service';
import { HoleRecord, GolfRound } from '../golf.types';

describe('golfService', () => {
  describe('isGIR', () => {
    it('should return true when on green in regulation', () => {
      // Par 4: 2 strokes to green (4 - 2 = 2)
      expect(golfService.isGIR(4, 2, 4)).toBe(true); // 4 - 2 = 2 (<= 2)
      // Par 3: 1 stroke to green (3 - 2 = 1)
      expect(golfService.isGIR(3, 2, 3)).toBe(true); // 3 - 2 = 1 (<= 1)
      // Par 5: 3 strokes to green (5 - 2 = 3)
      expect(golfService.isGIR(5, 2, 5)).toBe(true); // 5 - 2 = 3 (<= 3)
    });

    it('should return false when not on green in regulation', () => {
      // Par 4: 3 strokes to green
      expect(golfService.isGIR(5, 2, 4)).toBe(false); // 5 - 2 = 3 (> 2)
      // Par 3: 2 strokes to green
      expect(golfService.isGIR(4, 2, 3)).toBe(false); // 4 - 2 = 2 (> 1)
    });
  });

  describe('updateMissShotPatterns', () => {
    it('should add "쓰리펏" when putt >= 3', () => {
      expect(golfService.updateMissShotPatterns('슬라이스', 3)).toBe('슬라이스,쓰리펏');
      expect(golfService.updateMissShotPatterns('없음', 3)).toBe('쓰리펏');
    });

    it('should maintain FIFO logic when already 2 patterns exist', () => {
      // If 'Slice, Hook' exists and 3-putt happens, it should be 'Hook, Three-putt'
      expect(golfService.updateMissShotPatterns('슬라이스,훅', 3)).toBe('훅,쓰리펏');
    });

    it('should remove "쓰리펏" when putt < 3', () => {
      expect(golfService.updateMissShotPatterns('슬라이스,쓰리펏', 2)).toBe('슬라이스');
      expect(golfService.updateMissShotPatterns('쓰리펏', 2)).toBe('없음');
    });

    it('should return current patterns if no change needed', () => {
      expect(golfService.updateMissShotPatterns('슬라이스', 2)).toBe('슬라이스');
      expect(golfService.updateMissShotPatterns('쓰리펏', 3)).toBe('쓰리펏');
    });
  });

  describe('calculateSummary', () => {
    const mockHoles: HoleRecord[] = [
      { holeNo: 1, par: 4, stroke: 4, putt: 2, missShot: '없음', isGIR: true, ob: 0, penalty: 0 }, // Par, GIR
      { holeNo: 2, par: 3, stroke: 2, putt: 1, missShot: '없음', isGIR: true, ob: 0, penalty: 0 }, // Birdie, GIR
      { holeNo: 3, par: 4, stroke: 6, putt: 3, missShot: '슬라이스,쓰리펏', isGIR: false, ob: 1, penalty: 0 }, // DoubleBogey, OB, MissShot, Three-putt
    ];

    it('should calculate total score and statistics correctly', () => {
      const summary = golfService.calculateSummary(mockHoles);
      
      expect(summary.totalScore).toBe(12); // 4 + 2 + 6
      expect(summary.totalPar).toBe(11); // 4 + 3 + 4
      expect(summary.totalPutt).toBe(6); // 2 + 1 + 3
      expect(summary.birdies).toBe(1);
      expect(summary.pars).toBe(1);
      expect(summary.doubleBogeys).toBe(1);
      expect(summary.obCount).toBe(1);
      expect(summary.girRate).toBe(67); // 2/3 * 100
    });

    it('should count miss shots by situation (Iron vs Driver)', () => {
      const summary = golfService.calculateSummary(mockHoles);
      
      expect(summary.missShots['슬라이스']).toBe(1);
      expect(summary.missShots['쓰리펏']).toBe(1);
      
      // Hole 3 is Par 4 -> Driver miss shot
      expect(summary.driverMissShots['슬라이스']).toBe(1);
      expect(summary.ironMissShots['슬라이스']).toBe(0);
    });
  });

  describe('resolveMergedRounds', () => {
    it('should merge remote rounds into local with priority to latest updatedAt', () => {
      const local: GolfRound[] = [
        { id: '1', date: '2024-03-01', updatedAt: 100, holes: [], courseName: 'Club A', courseType: 'Out-In', teeColor: 'White' }
      ];
      const remote: GolfRound[] = [
        { id: '1', date: '2024-03-01', updatedAt: 200, holes: [{ holeNo: 1, par: 4, stroke: 4, putt: 2, isGIR: true, ob: 0, penalty: 0 }], courseName: 'Club A', courseType: 'Out-In', teeColor: 'White' },
        { id: '2', date: '2024-03-02', updatedAt: 150, holes: [], courseName: 'Club A', courseType: 'Out-In', teeColor: 'White' }
      ];

      const merged = golfService.resolveMergedRounds(local, remote);
      
      expect(merged.length).toBe(2);
      expect(merged.find(r => r.id === '1')?.updatedAt).toBe(200);
      expect(merged.find(r => r.id === '2')?.id).toBe('2');
    });

    it('should prioritize round with more holes if updatedAt is equal', () => {
      const local: GolfRound[] = [
        { id: '1', date: '2024-03-01', updatedAt: 100, holes: [], courseName: 'Club A', courseType: 'Out-In', teeColor: 'White' }
      ];
      const remote: GolfRound[] = [
        { id: '1', date: '2024-03-01', updatedAt: 100, holes: [{ holeNo: 1, par: 4, stroke: 4, putt: 2, isGIR: true, ob: 0, penalty: 0 }], courseName: 'Club A', courseType: 'Out-In', teeColor: 'White' }
      ];

      const merged = golfService.resolveMergedRounds(local, remote);
      expect(merged[0].holes.length).toBe(1);
    });
  });

  describe('validateClubData', () => {
    it('should return isValid true for correct data', () => {
      const validClub = {
        courses: [{
          holes: Array(9).fill({ par: 4, holeNumber: 1, distances: [{ teeColor: 'White', distanceMeter: 300 }] })
        }]
      };
      // 9 holes * Par 4 = 36
      const result = golfService.validateClubData(validClub as any);
      expect(result.isValid).toBe(true);
    });

    it('should catch incorrect hole count', () => {
      const invalidClub = {
        courses: [{ holes: Array(8).fill({ par: 4, holeNumber: 1, distances: [] }) }]
      };
      const result = golfService.validateClubData(invalidClub as any);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('홀 수가 9개가 아닙니다');
    });

    it('should catch incorrect Par sum', () => {
      const invalidClub = {
        courses: [{ holes: Array(9).fill({ par: 3, holeNumber: 1, distances: [{ teeColor: 'White', distanceMeter: 100 }] }) }]
      };
      // 9 * 3 = 27 (!= 36)
      const result = golfService.validateClubData(invalidClub as any);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('Par 합계가 36이 아닙니다');
    });
  });

  describe('validateRoundData', () => {
    it('should detect abnormal strokes', () => {
      const round: any = {
        holes: [{ holeNo: 1, par: 4, stroke: 16, putt: 2 }]
      };
      const result = golfService.validateRoundData(round);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('비정상적으로 높은 타수');
    });

    it('should ensure stroke > putt', () => {
      const round: any = {
        holes: [{ holeNo: 1, par: 4, stroke: 2, putt: 2 }]
      };
      const result = golfService.validateRoundData(round);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('타수는 반드시 퍼트 수보다 커야 합니다');
    });
  });
});
