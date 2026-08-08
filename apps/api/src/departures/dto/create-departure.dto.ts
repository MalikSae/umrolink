import { IsString, IsNotEmpty, IsInt, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartureDto {
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @IsISO8601()
  @IsNotEmpty()
  departureDate: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quota: number;
}
