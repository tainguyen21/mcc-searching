import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { StartJobUseCase } from '../../../application/ingestion/start-job.use-case';
import { ManageSourceUseCase } from '../../../application/sources/manage-source.use-case';
import { AdminGuard } from '../auth/admin.guard';

class CreateSourceDto {
  @IsString()
  sourceKey!: string;

  @IsIn(['community', 'facebook', 'bank'])
  type!: 'community' | 'facebook' | 'bank';

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  externalIdentifier?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  sourceUrl?: string;

  @IsString()
  schedule!: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class UpdateSourceDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  externalIdentifier?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

@Controller('admin/sources')
@UseGuards(AdminGuard)
export class SourcesController {
  constructor(
    private readonly manageSources: ManageSourceUseCase,
    private readonly startJob: StartJobUseCase,
  ) {}

  @Get()
  list() {
    return this.manageSources.list();
  }

  @Post()
  create(@Body() input: CreateSourceDto) {
    return this.manageSources.create({
      sourceKey: input.sourceKey,
      type: input.type,
      displayName: input.displayName,
      externalIdentifier: input.externalIdentifier ?? null,
      sourceUrl: input.sourceUrl ?? null,
      schedule: input.schedule,
      retentionDays: input.retentionDays,
      enabled: input.enabled,
    });
  }

  @Patch(':sourceId')
  async update(
    @Param('sourceId') sourceId: string,
    @Body() input: UpdateSourceDto,
  ) {
    const source = await this.manageSources.update(sourceId, input);
    if (!source) {
      throw new NotFoundException('Source not found');
    }
    return source;
  }

  @Post(':sourceId/jobs')
  start(@Param('sourceId') sourceId: string) {
    return this.startJob.execute(sourceId);
  }
}
