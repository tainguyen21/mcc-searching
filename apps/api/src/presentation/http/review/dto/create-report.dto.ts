import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  merchantName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address!: string;

  @IsString()
  @Matches(/^\d{4}$/)
  mccCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issuerBank!: string;

  @IsIn(['offline', 'online'])
  channel!: 'offline' | 'online';
}
