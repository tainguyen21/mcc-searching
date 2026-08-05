import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  idToken!: string;
}
