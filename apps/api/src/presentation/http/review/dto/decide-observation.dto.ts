import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DecideObservationDto {
  @IsIn(['approved', 'rejected', 'hidden'])
  status!: 'approved' | 'rejected' | 'hidden';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsUUID()
  merchantId?: string;

  @IsOptional()
  @IsUUID()
  merchantLocationId?: string;
}

export class MergeMerchantLocationDto {
  @IsUUID()
  duplicateLocationId!: string;

  @IsUUID()
  canonicalLocationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
