import type {
  ObservationRecord,
  ObservationRepository,
} from '../ports/observation.repository';

export class ListStagingUseCase {
  constructor(private readonly observations: ObservationRepository) {}

  execute(input: {
    page: number;
    pageSize: number;
  }): Promise<ObservationRecord[]> {
    return this.observations.listForAdmin({
      statuses: ['staging'],
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
