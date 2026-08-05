import { Transform, Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  query?: string;

  @IsOptional()
  @Matches(/^\d{4}$/)
  mccCode?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  radiusKm?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1_000_000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  pageSize?: number;
}
