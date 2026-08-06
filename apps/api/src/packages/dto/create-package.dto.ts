import { IsString, MinLength, IsOptional, IsInt, Min, IsArray, ValidateNested, IsDateString, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class DepartureDto {
  @IsDateString()
  departureDate: string;

  @IsInt()
  @Min(1)
  quota: number;
}

export class CreatePackageDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  airline?: string;

  @IsOptional()
  @IsString()
  hotelMakkah?: string;

  @IsOptional()
  @IsString()
  hotelMadinah?: string;

  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsString()
  exclude?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceQuad?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceTriple?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceDouble?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  agentCommission?: number;

  @IsOptional()
  @IsString()
  tempImage?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'published';

  @IsArray()
  @ArrayMinSize(1, { message: 'departures minimal harus ada 1 jadwal keberangkatan' })
  @ValidateNested({ each: true })
  @Type(() => DepartureDto)
  departures: DepartureDto[];
}
