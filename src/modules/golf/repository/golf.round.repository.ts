import { localRoundRepository } from './golf.round.local.repository';
import { syncRoundRepository } from './golf.round.sync.repository';

export const roundRepository = {
    ...localRoundRepository,
    ...syncRoundRepository,
};
