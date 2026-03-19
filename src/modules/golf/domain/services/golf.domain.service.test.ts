import { golfDomainService } from './golf.domain.service';
import { HoleRecord, GolfRound } from '../golf.types';

describe('golfDomainService', () => {
  describe('isGIR', () => {
    it('should return true when on green in regulation', () => {
      // Par 4: 2 strokes to green (4 - 2 = 2)
      expect(golfDomainService.isGIR(4, 2, 4)).toBe(true); // 4 - 2 = 2 (<= 2)
      // Par 3: 1 stroke to green (3 - 2 = 1)
      expect(golfDomainService.isGIR(3, 2, 3)).toBe(true); // 3 - 2 = 1 (<= 1)
      // Par 5: 3 strokes to green (5 - 2 = 3)
      expect(golfDomainService.isGIR(5, 2, 5)).toBe(true); // 5 - 2 = 3 (<= 3)
    });

    it('should return false when not on green in regulation', () => {
      // Par 4: 3 strokes to green
      expect(golfDomainService.isGIR(5, 2, 4)).toBe(false); // 5 - 2 = 3 (> 2)
      // Par 3: 2 strokes to green
      expect(golfDomainService.isGIR(4, 2, 3)).toBe(false); // 4 - 2 = 2 (> 1)
    });
  });

  describe('updateMissShotPatterns', () => {
    it('should add "쓰리펏" when putt >= 3', () => {
      expect(golfDomainService.updateMissShotPatterns('슬라이스', 3)).toBe('슬라이스,쓰리펏');
      expect(golfDomainService.updateMissShotPatterns('없음', 3)).toBe('쓰리펏');
    });

    it('should maintain FIFO logic when already 2 patterns exist', () => {
      // If 'Slice, Hook' exists and 3-putt happens, it should be 'Hook, Three-putt'
      expect(golfDomainService.updateMissShotPatterns('슬라이스,훅', 3)).toBe('훅,쓰리펏');
    });

    it('should remove "쓰리펏" when putt < 3', () => {
      expect(golfDomainService.updateMissShotPatterns('슬라이스,쓰리펏', 2)).toBe('슬라이스');
      expect(golfDomainService.updateMissShotPatterns('쓰리펏', 2)).toBe('없음');
    });

    it('should return current patterns if no change needed', () => {
      expect(golfDomainService.updateMissShotPatterns('슬라이스', 2)).toBe('슬라이스');
      expect(golfDomainService.updateMissShotPatterns('쓰리펏', 3)).toBe('쓰리펏');
    });
  });

  describe('calculateSummary', () => {
    const mockHoles: HoleRecord[] = [
      { holeNo: 1, par: 4, stroke: 4, putt: 2, missShot: '없음', isGIR: true, ob: 0, penalty: 0 }, // Par, GIR
      { holeNo: 2, par: 3, stroke: 2, putt: 1, missShot: '없음', isGIR: true, ob: 0, penalty: 0 }, // Birdie, GIR
      { holeNo: 3, par: 4, stroke: 6, putt: 3, missShot: '슬라이스,쓰리펏', isGIR: false, ob: 1, penalty: 0 }, // DoubleBogey, OB, MissShot, Three-putt
    ];

    it('should calculate total score and statistics correctly', () => {
      const summary = golfDomainService.calculateSummary(mockHoles);
      
      expect(summary.totalScore).toBe(12); // 4 + 2 + 6
      expect(summary.totalPar).toBe(11); // 4 + 3 + 4
      expect(summary.totalPutt).toBe(6); // 2 + 1 + 3
      expect(summary.birdies).toBe(1);
      expect(summary.pars).toBe(1);
      expect(summary.doubleBogeys).toBe(1);
      expect(summary.obCount).toBe(1);
      expect(summary.girRate).toBe(67); // 2/3 * 100
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

      const merged = golfDomainService.resolveMergedRounds(local, remote);
      
      expect(merged.length).toBe(2);
      expect(merged.find(r => r.id === '1')?.updatedAt).toBe(200);
      expect(merged.find(r => r.id === '2')?.id).toBe('2');
    });
  });

  describe('validateRoundData', () => {
    it('should detect abnormal strokes', () => {
      const round: any = {
        holes: [{ holeNo: 1, par: 4, stroke: 16, putt: 2 }]
      };
      const result = golfDomainService.validateRoundData(round as GolfRound);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('비정상적으로 높은 타수');
    });

    it('should ensure stroke > putt', () => {
      const round: any = {
        holes: [{ holeNo: 1, par: 4, stroke: 2, putt: 2 }]
      };
      const result = golfDomainService.validateRoundData(round as GolfRound);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('타수는 반드시 퍼트 수보다 커야 합니다');
    });
  });

  describe('validateClubData', () => {
    it('should return isValid true for correct 9-hole course', () => {
      const club = {
        name: 'Test Club',
        courses: [{
          name: 'Lake',
          holes: Array.from({ length: 9 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            distances: { White: 300 }
          }))
        }]
      };
      const result = golfDomainService.validateClubData(club);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    it('should return warnings for par sum != 36', () => {
      const club = {
        name: 'Test Club',
        courses: [{
          name: 'Lake',
          holes: Array.from({ length: 9 }, (_, i) => ({
            holeNumber: i + 1,
            par: (i === 0 ? 5 : 4), // 1 + 8*4 = 37
            distances: { White: 300 }
          }))
        }]
      };
      const result = golfDomainService.validateClubData(club);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain('파 합계가 36이 아닙니다');
    });

    it('should return isValid false for empty name or courses', () => {
      expect(golfDomainService.validateClubData({ name: '', courses: [] }).isValid).toBe(false);
      expect(golfDomainService.validateClubData({ name: 'Club' }).isValid).toBe(false);
    });

    it('should return isValid false if hole count is not 9 or 18', () => {
      const club = {
        name: 'Test Club',
        courses: [{
          name: 'Short',
          holes: Array.from({ length: 8 }, (_, i) => ({ holeNumber: i + 1, par: 4, distances: { W: 1 } }))
        }]
      };
      const result = golfDomainService.validateClubData(club);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('홀 수가 유효하지 않습니다');
    });

    it('should return isValid false if distances are missing or invalid', () => {
      const club = {
        name: 'Test Club',
        courses: [{
          name: 'Lake',
          holes: Array.from({ length: 9 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            distances: i === 0 ? {} : { White: 300 }
          }))
        }]
      };
      const result = golfDomainService.validateClubData(club);
      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('거리 데이터가 없습니다');
    });
  });
});
