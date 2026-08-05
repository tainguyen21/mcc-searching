import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateCommunityReportUseCase } from '../../../application/reports/create-community-report.use-case';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateReportDto } from '../review/dto/create-report.dto';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(
    private readonly createCommunityReport: CreateCommunityReportUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() input: CreateReportDto,
    @CurrentUser() currentUser: { id: string },
  ): Promise<{ observationId: string; status: 'staging'; duplicate: boolean }> {
    const result = await this.createCommunityReport.execute({
      ...input,
      userId: currentUser.id,
    });

    return {
      ...result,
      status: 'staging',
    };
  }
}
