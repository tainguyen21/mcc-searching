import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class BankPolicyDto {
  @IsString()
  sourceKey!: string;

  @IsString()
  bankCode!: string;

  @IsUrl({ require_tld: false })
  documentUrl!: string;

  @Matches(/^[a-f0-9]{64}$/)
  documentHash!: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsArray()
  @Matches(/^\d{4}$/, { each: true })
  eligibleMccCodes!: string[];

  @IsArray()
  @Matches(/^\d{4}$/, { each: true })
  excludedMccCodes!: string[];
}
