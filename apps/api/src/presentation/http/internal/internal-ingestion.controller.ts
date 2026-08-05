import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ReceiveNormalizedObservationUseCase } from '../../../application/ingestion/receive-normalized-observation.use-case';
import { ReceiveBankPolicyUseCase } from '../../../application/ingestion/receive-bank-policy.use-case';
import { InternalApiKeyGuard } from './internal-api-key.guard';
import { NormalizedObservationDto } from './dto/normalized-observation.dto';
import { BankPolicyDto } from './dto/bank-policy.dto';

@Controller('internal/ingestion')
@UseGuards(InternalApiKeyGuard)
export class InternalIngestionController {
  constructor(
    private readonly receiveNormalizedObservation: ReceiveNormalizedObservationUseCase,
    private readonly receiveBankPolicy: ReceiveBankPolicyUseCase,
  ) {}

  @Post('observations')
  receive(@Body() input: NormalizedObservationDto) {
    return this.receiveNormalizedObservation.execute(input);
  }

  @Post('bank-policies')
  receivePolicy(@Body() input: BankPolicyDto) {
    return this.receiveBankPolicy.execute(input);
  }
}
