import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class NormalizedObservationDto {
  @IsString()
  @MaxLength(100)
  sourceKey!: string;

  @IsString()
  @MaxLength(500)
  externalItemId!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  sourceUrl!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  observedAt?: Date;

  @IsString()
  @MaxLength(255)
  merchantName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @Matches(/^\d{4}$/)
  mccCode!: string;

  @IsIn(['offline', 'online'])
  channel!: 'offline' | 'online';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuerBank?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cardNetwork?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  evidenceSnippet?: string;
}
