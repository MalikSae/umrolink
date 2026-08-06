import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  departureId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nama harus minimal 3 karakter' })
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
