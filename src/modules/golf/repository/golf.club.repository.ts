import { clubQueryRepository } from './golf.club.query.repository';
import { clubMutationRepository } from './golf.club.mutation.repository';

export const clubRepository = {
    ...clubQueryRepository,
    ...clubMutationRepository,
};
