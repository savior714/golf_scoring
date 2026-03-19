import { RoundRepositoryImpl } from './repositories/RoundRepositoryImpl';
import { ClubRepositoryImpl } from './repositories/ClubRepositoryImpl';
import { MatchRepositoryImpl } from './repositories/MatchRepositoryImpl';

export * from './repositories';

export const roundRepository = new RoundRepositoryImpl();
export const clubRepository = new ClubRepositoryImpl();
export const matchRepository = new MatchRepositoryImpl();
