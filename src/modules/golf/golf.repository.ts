import { roundRepository as _roundRepository } from './repository/golf.round.repository';
import { clubRepository as _clubRepository } from './repository/golf.club.repository';
import { matchRepository as _matchRepository } from './repository/golf.match.repository';

/**
 * [Aggregator] Golf Repository
 * 
 * 300라인 제한 및 모듈화를 위해 실제 로직은 ./repository/ 하위 파일로 분리되었습니다.
 * 기존 참조 유지(Backward Compatibility)를 위해 Aggregator 패턴을 사용합니다.
 */

// 1. 라운드 관련 레포지토리 (로컬 스토리지 & 서버 동기화)
export const roundRepository = _roundRepository;

// 2. 클럽/구장 관련 레포지토리 (마스터 데이터 & 매칭)
export const clubRepository = {
    ..._clubRepository,
    // 기존 clubRepository에 포함되어 있던 매칭 로직을 결합하여 내보냄
    repairRoundCourseIds: _matchRepository.repairRoundCourseIds
};