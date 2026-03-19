import { roundRepository, clubRepository, matchRepository } from '../infrastructure';
import { GolfApplicationService } from './golf.application.service';

export * from './golf.application.service';
export const golfApplicationService = new GolfApplicationService(roundRepository, clubRepository, matchRepository);
