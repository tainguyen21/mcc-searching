import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DecideObservationUseCase } from '../../../application/review/decide-observation.use-case';
import { ListStagingUseCase } from '../../../application/review/list-staging.use-case';
import { MergeMerchantLocationUseCase } from '../../../application/review/merge-merchant-location.use-case';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  DecideObservationDto,
  MergeMerchantLocationDto,
} from './dto/decide-observation.dto';

@Controller('admin/review')
@UseGuards(AdminGuard)
export class ReviewController {
  constructor(
    private readonly listStaging: ListStagingUseCase,
    private readonly decideObservation: DecideObservationUseCase,
    private readonly mergeMerchantLocation: MergeMerchantLocationUseCase,
  ) {}

  @Get('staging')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listStaging.execute({
      page: boundedPositiveInteger(page, 1, 1_000_000),
      pageSize: boundedPositiveInteger(pageSize, 20, 100),
    });
  }

  @Post(':observationId/decision')
  @HttpCode(HttpStatus.NO_CONTENT)
  async decide(
    @Param('observationId') observationId: string,
    @Body() input: DecideObservationDto,
    @CurrentUser() currentUser: { id: string },
  ): Promise<void> {
    await this.decideObservation.execute({
      ...input,
      observationId,
      actorUserId: currentUser.id,
    });
  }

  @Post('merge-location')
  @HttpCode(HttpStatus.NO_CONTENT)
  async mergeLocation(
    @Body() input: MergeMerchantLocationDto,
    @CurrentUser() currentUser: { id: string },
  ): Promise<void> {
    await this.mergeMerchantLocation.execute({
      ...input,
      actorUserId: currentUser.id,
    });
  }
}

function boundedPositiveInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}
