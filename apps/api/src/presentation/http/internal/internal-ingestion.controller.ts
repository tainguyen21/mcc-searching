import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ReceiveNormalizedObservationUseCase } from '../../../application/ingestion/receive-normalized-observation.use-case';
import { InternalApiKeyGuard } from './internal-api-key.guard';
import { NormalizedObservationDto } from './dto/normalized-observation.dto';

@Controller('internal/ingestion')
@UseGuards(InternalApiKeyGuard)
export class InternalIngestionController {
  constructor(
    private readonly receiveNormalizedObservation: ReceiveNormalizedObservationUseCase,
  ) {}

  @Post('observations')
  receive(@Body() input: NormalizedObservationDto) {
    return this.receiveNormalizedObservation.execute(input);
  }
}
